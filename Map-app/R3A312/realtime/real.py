import requests

url = "https://api-challenge.odpt.org/api/v4/gtfs/realtime/jreast_odpt_train_vehicle?acl:consumerKey=fmig1fzk4tflkt40zz4u43z5sg3xrs53jlytlin6numuleq142eqr7ezzxkui28v"  # ← オープンデータのURL
response = requests.get(url)

binary_data = response.content  # ← これがprotobufの中身
