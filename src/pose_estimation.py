# Straight from https://github.com/hailo-ai/hailo-rpi5-examples
import gi
gi.require_version('Gst', '1.0')
gi.require_version('GstApp', '1.0')
from gi.repository import Gst, GstApp, GLib
import os
import argparse
import multiprocessing
import numpy as np
import setproctitle
import cv2
import time
import hailo
from hailo_rpi_common import (
    get_default_parser,
    QUEUE,
    get_caps_from_pad,
    get_numpy_from_buffer,
    GStreamerApp,
    app_callback_class,
)
from flask import Flask, Response, send_from_directory
from flask_socketio import SocketIO, emit
import base64
import threading
from collections import deque

# -----------------------------------------------------------------------------------------------
# User-defined class to be used in the callback function
# -----------------------------------------------------------------------------------------------
# Inheritance from the app_callback_class
class user_app_callback_class(app_callback_class):
    def __init__(self):
        super().__init__()

# -----------------------------------------------------------------------------------------------
# User-defined callback function
# -----------------------------------------------------------------------------------------------

# This is the callback function that will be called when data is available from the pipeline
def app_callback(pad, info, user_data):
    # Get the GstBuffer from the probe info
    buffer = info.get_buffer()
    # Check if the buffer is valid
    if buffer is None:
        return Gst.PadProbeReturn.OK

    # Using the user_data to count the number of frames
    user_data.increment()
    string_to_print = f"Frame count: {user_data.get_count()}\n"

    # Get the caps from the pad
    format, width, height = get_caps_from_pad(pad)

    # If the user_data.use_frame is set to True, we can get the video frame from the buffer
    frame = None
    if user_data.use_frame and format is not None and width is not None and height is not None:
        # Get video frame
        frame = get_numpy_from_buffer(buffer, format, width, height)

    # Get the detections from the buffer
    roi = hailo.get_roi_from_buffer(buffer)
    detections = roi.get_objects_typed(hailo.HAILO_DETECTION)

    recent_detections = []
    keypoints = get_keypoints()

    # Parse the detections
    for detection in detections:
        recent_detection = {}
        label = detection.get_label()
        bbox = detection.get_bbox()
        recent_detection["bbox"] = {
            "width": bbox.width(),
            "height": bbox.height(),
            "xmin": bbox.xmin(),
            "ymin": bbox.ymin(),
            "xmax": bbox.xmax(),
            "ymax": bbox.ymax()
        }
        confidence = detection.get_confidence()
        if label == "person":
            string_to_print += (f"Detection: {label} {confidence:.2f}\n")
            # Pose estimation landmarks from detection (if available)
            landmarks = detection.get_objects_typed(hailo.HAILO_LANDMARKS)
            if len(landmarks) != 0:
                points = landmarks[0].get_points()

                for key in keypoints:                 
                    body_part = points[keypoints[key] - 1]
                    body_part_x = int((body_part.x() * bbox.width() + bbox.xmin()) * width)
                    body_part_y = int((body_part.y() * bbox.height() + bbox.ymin()) * height)
                    recent_detection[key] = {
                        "x": body_part_x,
                        "y": body_part_y
                    }
                
                recent_detections.append(recent_detection)

                if user_data.use_frame:
                    # Add markers to the frame to show eye landmarks
                    cv2.circle(frame, (left_eye_x, left_eye_y), 5, (0, 255, 0), -1)
                    cv2.circle(frame, (right_eye_x, right_eye_y), 5, (0, 255, 0), -1)
                    # Note: using imshow will not work here, as the callback function is not running in the main thread
    
    user_data.recent_detections = recent_detections

    if user_data.use_frame:
        # Convert the frame to BGR
        frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
        user_data.set_frame(frame)

    return Gst.PadProbeReturn.OK



# This function can be used to get the COCO keypoints coorespondence map
def get_keypoints():
    """Get the COCO keypoints and their left/right flip coorespondence map."""
    keypoints = {
        'nose': 1,
        'left_eye': 2,
        'right_eye': 3,
        'left_ear': 4,
        'right_ear': 5,
        'left_shoulder': 6,
        'right_shoulder': 7,
        'left_elbow': 8,
        'right_elbow': 9,
        'left_wrist': 10,
        'right_wrist': 11,
        'left_hip': 12,
        'right_hip': 13,
        'left_knee': 14,
        'right_knee': 15,
        'left_ankle': 16,
        'right_ankle': 17,
    }

    return keypoints
#-----------------------------------------------------------------------------------------------
# User Gstreamer Application
# -----------------------------------------------------------------------------------------------

# This class inherits from the hailo_rpi_common.GStreamerApp class

class GStreamerPoseEstimationApp(GStreamerApp):
    def __init__(self, args, user_data):
        # Call the parent class constructor
        super().__init__(args, user_data)
        # Additional initialization code can be added here
        # Set Hailo parameters these parameters should be set based on the model used
        self.batch_size = 2
        self.network_width = 640
        self.network_height = 640
        self.network_format = "RGB"
        self.default_postprocess_so = os.path.join(self.postprocess_dir, 'libyolov8pose_post.so')
        self.post_function_name = "filter"
        self.hef_path = os.path.join(self.current_path, '../resources/yolov8s_pose_h8l_pi.hef')
        self.app_callback = app_callback

        # Set the process title
        setproctitle.setproctitle("Hailo Pose Estimation App")

        self.create_pipeline()

        self.hailo_sink = self.pipeline.get_by_name("hailo_sink")
        # self.frame_buffer = deque(maxlen=5)
        # self.frame_lock = threading.Lock()
        # self.last_frame_time = 0
        # self.frame_interval = 1 / 10
        # self.stream_width = 320
        # self.stream_height = 240

    def get_pipeline_string(self):
        if self.source_type == "rpi":
            source_element = f"libcamerasrc name=src_0 ! "
            source_element += f"video/x-raw, format={self.network_format}, width=4608, height=2592 ! "
            source_element += QUEUE("queue_src_scale")
            source_element += f"videoscale ! "
            source_element += f"video/x-raw, format={self.network_format}, width={self.network_width}, height={self.network_height}, framerate=30/1 ! "
        elif self.source_type == "usb":
            source_element = f"v4l2src device={self.video_source} name=src_0 ! "
            source_element += f"video/x-raw, width=640, height=480, framerate=30/1 ! "
        else:
            source_element = f"filesrc location=\"{self.video_source}\" name=src_0 ! "
            source_element += QUEUE("queue_dec264")
            source_element += f" qtdemux ! h264parse ! avdec_h264 max-threads=2 ! "
            source_element += f" video/x-raw,format=I420 ! "
        source_element += QUEUE("queue_scale")
        source_element += f"videoscale n-threads=2 ! "
        source_element += QUEUE("queue_src_convert")
        source_element += f"videoconvert n-threads=3 name=src_convert qos=false ! "
        source_element += f"video/x-raw, format={self.network_format}, width={self.network_width}, height={self.network_height}, pixel-aspect-ratio=1/1 ! "

        pipeline_string = "hailomuxer name=hmux "
        pipeline_string += source_element
        pipeline_string += "tee name=t ! "
        pipeline_string += QUEUE("bypass_queue", max_size_buffers=20) + "hmux.sink_0 "
        pipeline_string += "t. ! " + QUEUE("queue_hailonet")
        pipeline_string += "videoconvert n-threads=3 ! "

        # Attempt to remove black bars
        # pipeline_string += f"videoscale ! video/x-raw,width={self.network_width},height={self.network_height},method=4 ! "

        pipeline_string += f"hailonet hef-path={self.hef_path} batch-size={self.batch_size} force-writable=true ! "
        pipeline_string += QUEUE("queue_hailofilter")
        pipeline_string += f"hailofilter function-name={self.post_function_name} so-path={self.default_postprocess_so} qos=false ! "
        pipeline_string += QUEUE("queue_hmuc") + " hmux.sink_1 "
        pipeline_string += "hmux. ! " + QUEUE("queue_hailo_python")
        pipeline_string += QUEUE("queue_user_callback")
        pipeline_string += f"identity name=identity_callback ! "

        # Comment out the following line to disable default overlay 
        pipeline_string += QUEUE("queue_hailooverlay")
        pipeline_string += f"hailooverlay ! "

        pipeline_string += QUEUE("queue_videoconvert")
        pipeline_string += f"videoconvert n-threads=3 qos=false ! "
        pipeline_string += QUEUE("queue_hailo_display")
        pipeline_string += "appsink name=hailo_sink emit-signals=true max-buffers=1 drop=true "
        print(pipeline_string)
        return pipeline_string

    # def on_new_sample(self, sink):
    #     sample = sink.emit("pull-sample")
    #     buf = sample.get_buffer()
    #     caps = sample.get_caps()
    #     width = caps.get_structure(0).get_value("width")
    #     height = caps.get_structure(0).get_value("height")
        
    #     current_time = time.time()
    #     if current_time - self.last_frame_time < self.frame_interval:
    #         return Gst.FlowReturn.OK

    #     self.last_frame_time = current_time
        
    #     buffer_data = buf.extract_dup(0, buf.get_size())
    #     frame = np.ndarray(
    #         (height, width, 3),
    #         buffer=buffer_data,
    #         dtype=np.uint8
    #     )
        
    #     frame = cv2.resize(frame, (self.stream_width, self.stream_height))
        
    #     with self.frame_lock:
    #         self.frame_buffer.append(frame)
        
    #     return Gst.FlowReturn.OK

    # def get_latest_frame(self):
    #     with self.frame_lock:
    #         return self.frame_buffer[-1].copy() if self.frame_buffer else None

# Flask app setup
public_folder = os.path.join(os.path.dirname(__file__), 'frontend')
app = Flask(__name__, static_folder=public_folder)
socketio = SocketIO(app)

def generate_frame():
    sample = gstreamer_app.hailo_sink.try_pull_sample(Gst.SECOND)

    sample = gstreamer_app.hailo_sink.try_pull_sample(Gst.SECOND)
    if sample:
        buffer = sample.get_buffer()
        caps = sample.get_caps()
        
        structure = caps.get_structure(0)
        width = structure.get_value('width')
        height = structure.get_value('height')
        buffer_data = buffer.extract_dup(0, buffer.get_size())
        numpy_array = np.frombuffer(buffer_data, dtype=np.uint8)
        
        frame = numpy_array.reshape((height, width, 3))
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        _, frame_jpeg = cv2.imencode('.jpg', frame)
        frame_base64 = base64.b64encode(frame_jpeg).decode('utf-8')

        return {
            'frame': frame_base64,
            'detections': gstreamer_app.user_data.recent_detections
        }
        
    else:
        print("No sample received within timeout period")
        return None

@app.route('/<path:filename>')
def serve_public(filename):
    return send_from_directory(app.static_folder, filename)

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

def send_frames():
    while True:
        frame_base64 = generate_frame()
        socketio.emit('frame', frame_base64)
        time.sleep(0.03)

@socketio.on('connect')
def handle_connect():
    socketio.start_background_task(send_frames)

if __name__ == "__main__":
    user_data = user_app_callback_class()
    parser = get_default_parser()
    args = parser.parse_args()
    gstreamer_app = GStreamerPoseEstimationApp(args, user_data)
    gst_thread = threading.Thread(target=gstreamer_app.run)
    gst_thread.start()

    app.run(host='0.0.0.0', port=5000, threaded=True)
