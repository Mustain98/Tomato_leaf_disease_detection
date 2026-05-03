"use client"

import {useState} from "react"

type PredictionResponse ={
  prediction:string;
  confidence:number;
};

export default function Home(){
  const [file,setFile]=useState<File | null>(null);
  const [preview,setPreview]=useState<string|null>(null);
  const [prediction, setPrediction] = useState<string>("");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");



const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>)=>{
  const selectedFile=event.target.files?.[0];
  if(! selectedFile){
    return;
  }
  setFile(selectedFile);
  setPreview(URL.createObjectURL(selectedFile));
  setPrediction("");
  setConfidence(null);
  setError("");

};

const handlePredict = async () => {
    if (!file) {
      setError("Please upload an image first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setError("");
      setPrediction("");
      setConfidence(null);

      const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Prediction failed.");
      }

      const result = data as PredictionResponse;

      setPrediction(result.prediction);
      setConfidence(result.confidence);
    } catch (err) {
      console.error(err);
      setError("Could not get prediction. Make sure FastAPI backend is running.");
    } finally {
      setLoading(false);
    }
};

return(
  <main className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-10">
    <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
      <h1 className="text-2xl font-bold text-center text-gray-800">
        Tomato Leaf Disease Detection
      </h1>
      <p className="text-center text-gray-600 mt-2 mb-6">
          Upload a tomato leaf image and detect the disease.
      </p>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-600 mb-2">
        upload image
        </label>
      </div>
      <input 
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="w-full border border-gray-300 rounded-lg p-2 text-sm text-gray-400 mb-4"
      />
      {preview && (
        <div>
          <img src={preview} alt="leaf image" className="w-full h-64 object-cover rounded-xl border border-gray-200" />
        </div>
      )}
      <button
        onClick={handlePredict}
        disabled={loading}
        className="w-full bg-green-600 text-white font-semibold py-3 rounded-xl hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
      >
        {loading ? "predicting":"predict"}
      </button>
      {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm">
            {error}
          </div>
      )}
      {prediction && confidence !== null && (
          <div className="mt-6 bg-green-50 border border-green-200 p-4 rounded-xl">
            <h2 className="text-lg font-bold text-green-800">
              Prediction Result
            </h2>

            <p className="mt-2 text-gray-800">
              <span className="font-semibold">Disease:</span> {prediction}
            </p>

            <p className="mt-1 text-gray-800">
              <span className="font-semibold">Confidence:</span> {confidence}%
            </p>
          </div>
        )}
    </div>
  </main>
)

}
  
