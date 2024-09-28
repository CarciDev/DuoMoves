from flask import Flask, render_template
from picamera2 import PiCamera2
import io
import time

app = Flask(__name__)
camera = PiCamera2()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/video_feed')
def video_feed():
    stream = io.BytesIO()
    camera.capture(stream, 'jpeg')
    stream.seek(0)
    return stream.read()

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0")