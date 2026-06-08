import requests
import json

url = "http://127.0.0.1:8000/classify"
payload = {
    "text": "This is a short sample text, but it is worth noting that it must be at least fifty words long to pass validation. So let me continue writing more words. Here we will add some em dashes--they are quite nice to use in prose. Moreover, we will add some more sentences. The universe is incredibly vast and we must explore it. Let us continue. Another sentence goes here. And another one. We are just making sure the word count is strictly above the fifty words threshold. This is an extra sentence to be absolutely certain we hit fifty words and the FastAPI server successfully returns a response with the probabilities of the Stylometric classifer."
}
try:
    response = requests.post(url, json=payload)
    print("Status Code:", response.status_code)
    print("Response JSON:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print("Error:", e)
