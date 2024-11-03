'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { put } from '@vercel/blob'

const Sketch = dynamic(() => import('react-p5').then((mod) => mod.default), {
  ssr: false,
})

export default function P5Canvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [lastSaveTime, setLastSaveTime] = useState(Date.now())

  const setup = (p5: any, canvasParentRef: Element) => {
    const canvas = p5.createCanvas(400, 400).parent(canvasParentRef)
    canvasRef.current = canvasParentRef.querySelector('canvas') as HTMLCanvasElement
    p5.background(255)
    p5.strokeWeight(4)
    p5.stroke(0)
    p5.noFill()

    // Enable touch events
    canvas.touchStarted(() => false)
    canvas.touchMoved(() => false)
    canvas.touchEnded(() => false)
  }

  const draw = (p5: any) => {
    // Check if 10 seconds have passed since the last save
    if (Date.now() - lastSaveTime > 10000) {
      saveCanvasToStorage()
      setLastSaveTime(Date.now())
    }

    // Draw a line if the mouse is pressed or a touch is active
    if (p5.mouseIsPressed || p5.touches.length > 0) {
      const x = p5.touches.length > 0 ? p5.touches[0].x : p5.mouseX
      const y = p5.touches.length > 0 ? p5.touches[0].y : p5.mouseY
      p5.line(p5.pmouseX, p5.pmouseY, x, y)
    }
  }

  const saveCanvasToStorage = async () => {
    if (canvasRef.current) {
      try {
        const blob = await new Promise<Blob>((resolve) => canvasRef.current!.toBlob(resolve as BlobCallback))
        const filename = `canvas_${Date.now()}.png`
        const { url } = await put(filename, blob, { access: 'public' })
        console.log('Canvas saved to:', url)
      } catch (error) {
        console.error('Error saving canvas:', error)
      }
    }
  }

  useEffect(() => {
    // Clean up function to save canvas one last time when component unmounts
    return () => {
      saveCanvasToStorage()
    }
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Draw on Canvas</h1>
      <Sketch setup={setup} draw={draw} />
      <p className="mt-4 text-sm text-gray-600">
        Draw with your mouse or touch. The canvas is automatically saved every 10 seconds.
      </p>
    </div>
  )
}