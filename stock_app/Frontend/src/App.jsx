import { useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [symbol, setSymbol] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePredict = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    try {
      // Dhyan rakhein: Flask port 5000 par chal raha hona chahiye
      const response = await axios.post('http://localhost:5000/predict', { 
        symbol: symbol 
      })
      setResult(response.data)
    } catch (err) {
      console.error("API Error:", err)
      setError("Prediction failed! Check if backend is running or symbol is valid.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h1>📊 Stock AI Predictor</h1>
        <p className="subtitle">LSTM Model Based Price Forecasting</p>

        <form onSubmit={handlePredict} className="input-group">
          <input 
            type="text" 
            placeholder="Enter Ticker (e.g. AAPL or TCS.NS)" 
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Analyzing...' : 'Predict'}
          </button>
        </form>

        {error && <p className="error-msg">{error}</p>}

        {result && (
          <div className="result-area">
            <div className="result-box">
              <h3>{result.symbol}</h3>
              <p>Predicted Price for Tomorrow</p>
              <h2 className="price">${result.prediction}</h2>
            </div>
            <p className="disclaimer">*Results are based on historical data patterns.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App