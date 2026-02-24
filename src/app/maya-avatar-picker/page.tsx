"use client"

import { useState } from 'react'
import { CheckCircle } from 'lucide-react'

const avatarOptions = [
  // Style A: Headset Professional
  { id: 'headset-a1', name: 'Headset Pro — Warm', description: 'Friendly professional with glowing headset, warm studio lighting', style: 'A' },
  { id: 'headset-a2', name: 'Headset Pro — Bold', description: 'Confident and sharp, dark navy background with tech accents', style: 'A' },
  { id: 'headset-a3', name: 'Headset Pro — Illustrated', description: 'Flat illustration style, blue/purple palette, SaaS mascot feel', style: 'A' },
  { id: 'headset-a4', name: 'Headset Pro — Night Shift', description: 'Glowing headset, dark background — visually communicates 24/7', style: 'A' },
  // Style D: Holographic
  { id: 'holo-d1', name: 'Holographic — Classic', description: 'Semi-transparent blue projection, sci-fi professional aesthetic', style: 'D' },
  { id: 'holo-d2', name: 'Holographic — Warm Glow', description: 'Blue/purple translucent glow, particle effects, otherworldly', style: 'D' },
  { id: 'holo-d3', name: 'Holographic — Minimal', description: 'Clean glowing outline, geometric face, flat meets hologram', style: 'D' },
  { id: 'holo-d4', name: 'Holographic — Vibrant', description: 'Neon blue/purple dynamic projection, high energy 24/7 feel', style: 'D' },
]

function AvatarCard({ avatar, selected, onSelect, accentColor }: {
  avatar: typeof avatarOptions[0]
  selected: boolean
  onSelect: () => void
  accentColor: string
}) {
  return (
    <div
      onClick={onSelect}
      className={`relative bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 ${
        selected ? `ring-4 ${accentColor}` : ''
      }`}
    >
      {selected && (
        <div className={`absolute top-4 right-4 z-10 ${accentColor === 'ring-blue-500' ? 'bg-blue-500' : 'bg-purple-500'} text-white rounded-full p-1.5`}>
          <CheckCircle className="h-5 w-5" />
        </div>
      )}
      <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200">
        <img
          src={`/maya-avatars/${avatar.id}.png`}
          alt={avatar.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23e5e7eb" width="400" height="400"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="20" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ELoading...%3C/text%3E%3C/svg%3E'
          }}
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 text-sm">{avatar.name}</h3>
        <p className="text-xs text-gray-500">{avatar.description}</p>
      </div>
    </div>
  )
}

export default function MayaAvatarPicker() {
  const [selected, setSelected] = useState<string | null>(null)

  const selectedAvatar = avatarOptions.find(a => a.id === selected)

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Choose Maya's Look</h1>
          <p className="text-gray-500 text-lg">Two style directions — pick your favorite or mix feedback from both</p>
        </div>

        {/* Style A */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">Style A</span>
            <h2 className="text-lg font-semibold text-gray-700">Headset Professional — AI phone employee, always on call</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {avatarOptions.filter(a => a.style === 'A').map(avatar => (
              <AvatarCard
                key={avatar.id}
                avatar={avatar}
                selected={selected === avatar.id}
                onSelect={() => setSelected(avatar.id)}
                accentColor="ring-blue-500"
              />
            ))}
          </div>
        </div>

        {/* Style D */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-5">
            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-bold">Style D</span>
            <h2 className="text-lg font-semibold text-gray-700">Holographic / Digital — futuristic AI projection</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {avatarOptions.filter(a => a.style === 'D').map(avatar => (
              <AvatarCard
                key={avatar.id}
                avatar={avatar}
                selected={selected === avatar.id}
                onSelect={() => setSelected(avatar.id)}
                accentColor="ring-purple-500"
              />
            ))}
          </div>
        </div>

        {/* Selection Panel */}
        {selectedAvatar && (
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Selected: {selectedAvatar.name}</h2>
            <p className="text-gray-500 mb-6 text-sm">
              Tell me what you'd like to adjust — or confirm this one to integrate it into Maya's presentation on the landing page.
            </p>
            <div className="flex gap-4">
              <button className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Use This Avatar
              </button>
              <button
                onClick={() => setSelected(null)}
                className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Keep Looking
              </button>
            </div>
          </div>
        )}

        {/* Hint */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 max-w-2xl mx-auto text-sm text-blue-800">
          <strong>Not quite right?</strong> Tell me what to change — different vibe, different colors, more/less realistic,
          different background, etc. I can generate new variations based on your feedback.
        </div>

      </div>
    </div>
  )
}
