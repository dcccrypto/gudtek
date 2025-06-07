'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { X, Upload, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onFileUpload: (file: File) => Promise<void>
  loading?: boolean
  maxFileSize?: number // in bytes
  acceptedTypes?: string[]
  className?: string
  disabled?: boolean
}

export function FileUpload({
  onFileUpload,
  loading = false,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  className,
  disabled = false
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return 'Please upload a valid image file (JPEG, PNG, GIF, or WebP)'
    }
    if (file.size > maxFileSize) {
      return `File size must be less than ${formatBytes(maxFileSize)}`
    }
    return null
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    const validationError = validateFile(file)
    
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setSelectedFile(file)

    // Create preview URL for images
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }, [acceptedTypes, maxFileSize])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (disabled || loading) return
    
    const files = e.dataTransfer.files
    handleFiles(files)
  }, [disabled, loading, handleFiles])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (disabled || loading) return
    
    const files = e.target.files
    handleFiles(files)
  }, [disabled, loading, handleFiles])

  const handleUpload = async () => {
    if (!selectedFile || loading) return

    try {
      setUploadProgress(0)
      setError(null)
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 100)

      await onFileUpload(selectedFile)
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      // Reset after successful upload
      setTimeout(() => {
        setSelectedFile(null)
        setPreviewUrl(null)
        setUploadProgress(0)
        if (inputRef.current) {
          inputRef.current.value = ''
        }
      }, 1000)
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Upload failed')
      setUploadProgress(0)
    }
  }

  const clearFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setError(null)
    setUploadProgress(0)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div className={cn('w-full', className)}>
      {!selectedFile ? (
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
            dragActive 
              ? 'border-orange-500 bg-orange-50' 
              : 'border-gray-300 hover:border-gray-400',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            multiple={false}
            accept={acceptedTypes.join(',')}
            onChange={handleChange}
            className="hidden"
            disabled={disabled}
          />
          
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {dragActive ? 'Drop your meme here!' : 'Upload your meme'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Drag and drop or{' '}
                <span className="text-orange-600 hover:text-orange-700 font-medium">
                  browse files
                </span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Max size: {formatBytes(maxFileSize)} • Supports: JPEG, PNG, GIF, WebP
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* File Preview */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-start gap-4">
              {previewUrl ? (
                <div className="flex-shrink-0">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-20 h-20 rounded-lg object-cover border"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatBytes(selectedFile.size)}
                </p>
                
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-2">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">
                      Uploading... {uploadProgress}%
                    </p>
                  </div>
                )}
                
                {uploadProgress === 100 && (
                  <p className="text-xs text-green-600 mt-1 font-medium">
                    ✓ Upload successful!
                  </p>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFile}
                disabled={loading}
                className="flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Upload Button */}
          {uploadProgress === 0 && (
            <Button
              onClick={handleUpload}
              disabled={loading || !selectedFile}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              {loading ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Meme
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  )
} 