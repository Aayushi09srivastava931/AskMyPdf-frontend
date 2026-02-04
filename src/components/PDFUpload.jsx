import { useState, useRef } from 'react'
import api from '../utils/api'
import './PDFUpload.css'

function PDFUpload({ onUploadSuccess, isIndexing, setIsIndexing }) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState(null)
  const [uploadedFileName, setUploadedFileName] = useState(null)
  const [indexingStatus, setIndexingStatus] = useState('')
  const fileInputRef = useRef(null)

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFileSelect = (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFile = async (file) => {
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    setError(null)
    setUploadProgress(0)
    setUploadedFileName(file.name)
    setIndexingStatus('')

    try {
      // Upload PDF
      setIndexingStatus('Uploading PDF...')
      const formData = new FormData()
      formData.append('pdf', file)

      const uploadResponse = await api.post('/api/upload-pdf', formData, {
        // Don't set Content-Type header - axios will set it automatically with boundary for FormData
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 50) / progressEvent.total // 0-50% for upload
          )
          setUploadProgress(percentCompleted)
        },
      })

      if (uploadResponse.data.filename) {
        setUploadProgress(50)
        setIsIndexing(true)
        setIndexingStatus('Processing PDF and creating embeddings...')

        // Index PDF to Pinecone
        try {
          const indexResponse = await api.post('/api/index-pdf', {
            filename: uploadResponse.data.filename,
          })

          setUploadProgress(90)
          setIndexingStatus('Finalizing...')
          
          setTimeout(() => {
            setUploadProgress(100)
            setIndexingStatus('Complete!')
            setTimeout(() => {
              onUploadSuccess()
              setIsIndexing(false)
            }, 500)
          }, 500)
        } catch (indexError) {
          console.error('Indexing error:', indexError)
          
          // Extract detailed error information
          const errorData = indexError.response?.data
          let errorMsg = 'Failed to index PDF. Please try again.'
          
          // Handle network errors
          if (!indexError.response) {
            errorMsg = indexError.message || 'Network error. Please ensure the backend server is running.'
          } else if (errorData) {
            if (errorData.details) {
              errorMsg = errorData.details
            } else if (errorData.message) {
              errorMsg = errorData.message
            } else if (errorData.error) {
              errorMsg = errorData.error
            }
            
            // Add step information if available
            if (errorData.step) {
              errorMsg += ` (Failed at: ${errorData.step})`
            }
            
            // Add original error in development
            if (errorData.originalError) {
              console.error('Original error:', errorData.originalError)
            }
          }
          
          setError(errorMsg)
          setIsIndexing(false)
          setUploadProgress(0)
          setIndexingStatus('')
        }
      }
    } catch (uploadError) {
      console.error('Upload error:', uploadError)
      
      let errorMsg = 'Failed to upload PDF. Please try again.'
      
      // Handle network errors
      if (!uploadError.response) {
        errorMsg = uploadError.message || 'Network error. Please ensure the backend server is running.'
      } else if (uploadError.response?.data?.error) {
        errorMsg = uploadError.response.data.error
      } else if (uploadError.message) {
        errorMsg = uploadError.message
      }
      
      setError(errorMsg)
      setIsIndexing(false)
      setUploadProgress(0)
      setIndexingStatus('')
    }
  }

  return (
    <div className="pdf-upload-container">
      <div
        className={`upload-area ${isDragging ? 'dragging' : ''} ${isIndexing ? 'indexing' : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isIndexing && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={isIndexing}
        />

        {isIndexing ? (
          <div className="upload-content">
            <div className="spinner"></div>
            <h2>{indexingStatus || 'Processing...'}</h2>
            <p>This may take a few moments</p>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="progress-text">{uploadProgress}%</p>
            {uploadedFileName && (
              <p className="file-name">📄 {uploadedFileName}</p>
            )}
          </div>
        ) : (
          <div className="upload-content">
            <div className="upload-icon">📄</div>
            <h2>Drag & Drop your PDF here</h2>
            <p>or click to browse</p>
            <p className="upload-hint">Only PDF files up to 10MB</p>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️</span> 
          <div>
            <strong>Error:</strong> {error}
            <br />
            <small>Check the browser console and server logs for more details.</small>
          </div>
        </div>
      )}
    </div>
  )
}

export default PDFUpload