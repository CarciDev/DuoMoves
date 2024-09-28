# local camera

from flask import Flask, render_template, Response
import cv2

app = Flask(__name__)

camera = cv2.VideoCapture(0)  

def generate_frames():
    while True:
        success, frame = camera.read()  
        if not success:
            break
        else:
            ret, buffer = cv2.imencode('.jpg', frame)
            frame = buffer.tobytes()

            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0")


# using picamera2
# from flask import Flask, render_template, Response
# from picamera2 import Picamera2
# import io
# import time

# app = Flask(__name__)

# camera = Picamera2()
# camera.configure(camera.create_video_configuration(main={"size": (640, 480)}))
# camera.start()

# def generate_frames():
#     while True:
#         stream = io.BytesIO()
#         try:
#             camera.capture_file(stream, format='jpeg')
#             stream.seek(0)
#             yield (b'--frame\r\n'
#                    b'Content-Type: image/jpeg\r\n\r\n' + stream.getvalue() + b'\r\n')
#         except Exception as e:
#             print(f"Error capturing frame: {e}")
#             time.sleep(0.1)

# @app.route('/')
# def index():
#     return render_template('index.html')

# @app.route('/video_feed')
# def video_feed():
#     return Response(generate_frames(),
#                     mimetype='multipart/x-mixed-replace; boundary=frame')

# if __name__ == '__main__':
#     app.run(debug=True, host='0.0.0.0', threaded=True)