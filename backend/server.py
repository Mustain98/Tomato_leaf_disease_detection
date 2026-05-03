from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io

import torch
import torch.nn as nn
from torchvision import models, transforms

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

IMG_SIZE=224
CLASSES = [
    "Bacterial Spot",
    "Early Blight",
    "Healthy",
    "Late Blight",
    "Septoria Leaf Spot",
    "Yellow Leaf Curl Virus",
]

transform=transforms.Compose([
    transforms.Resize((IMG_SIZE,IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(
        [.485, .456, .406],
        [.229, .224, .225]
    )
])

def load_model():

    model=models.efficientnet_b0(weights=None)

    in_features=model.classifier[1].in_features
    model.classifier[1]=nn.Linear(in_features, len(CLASSES))

    checkpoint=torch.load("best_model.pth", map_location=Device)

    model.load_state_dict(checkpoint["model_state_dict"])
    model.to(Device)
    model.eval()

    return model

model = load_model()

@app.get("/")
def get_root():
    return("APP IS RUNNING")

@app.post("/predict")
async def predict(file: UploadFile =File(...)):
    image_bytes=await file.read()

    image=Image.open(io.BytesIO(image_bytes)).convert("RGB")
    input_tensor=transform(image)
    input_tensor=input_tensor.unsqueeze(0)
    input_tensor=input_tensor.to(Device)

    with torch.no_grad():
        outputs=model(input_tensor)
        probabilities=torch.softmax(outputs,dim=1)
        confidence,predicted_index=torch.max(probabilities,1)

    predicted_class=CLASSES[predicted_index.item()]

    return{
        "prediction":predicted_class,
        "confidence":round(confidence.item()*100,2)
    }
