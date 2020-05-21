import json
from os import listdir
from os.path import isfile, join

import flask

app = flask.Flask(__name__)
app.config["DEBUG"] = True


@app.route('/', methods=['GET'])
def home():
    return "<h1>News framework.</p>"


@app.route('/news', methods=['GET'])
def news():
    data = {}
    with open('news.json') as json_file:
        data = json.load(json_file)
    return data


@app.route('/detailednews/<key>', methods=['GET'])
def detailed_news(key):
    data = {}
    with open('detailed_news.json') as json_file:
        data = json.load(json_file)

    onlyfiles = [f for f in listdir("./upload/"+key.upper()) if isfile(join("upload/"+key.upper(), f))]
    data["news"][key.lower()]["comments"] = onlyfiles
    return data["news"][key.lower()]


app.run(host="0.0.0.0", port=5000, use_reloader=False)
