import { useState } from 'react'
import PDFUpload from './components/PDFUpload'
import Chatbot from './components/Chatbot'
import './App.css'

function App() {
  const [pdfUploaded, setPdfUploaded] = useState(false)
  const [isIndexing, setIsIndexing] = useState(false)

  const handlePDFUploaded = () => {
    setPdfUploaded(true)
  }

  const handleNewUpload = () => {
    setPdfUploaded(false)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Enigma Chatbot</h1>
        <p>Upload a PDF and ask questions about it</p>
      </header>
      
      <main className="app-main">
        {!pdfUploaded ? (
          <PDFUpload 
            onUploadSuccess={handlePDFUploaded}
            isIndexing={isIndexing}
            setIsIndexing={setIsIndexing}
          />
        ) : (
          <Chatbot onNewUpload={handleNewUpload} />
        )}
      </main>
    </div>
  )
}

export default App
          