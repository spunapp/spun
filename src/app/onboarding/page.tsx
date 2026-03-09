'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Building2, ShoppingBag, Users, MapPin, Trophy, Upload,
  ArrowRight, ArrowLeft, Check, Loader2, Zap, X, Plus
} from 'lucide-react'

const STEPS = [
  { id: 1, title: 'Your Business', icon: Building2 },
  { id: 2, title: 'What You Sell', icon: ShoppingBag },
  { id: 3, title: 'Your Audience', icon: Users },
  { id: 4, title: 'Locations', icon: MapPin },
  { id: 5, title: 'Competitors', icon: Trophy },
  { id: 6, title: 'Brand Assets', icon: Upload },
]

interface OnboardingData {
  name: string
  description: string
  product_or_service: 'product' | 'service' | 'both' | ''
  what_they_sell: string
  industry: string
  target_audience: string
  demographics: {
    gender: string
    age_range: string
    income_range: string
    location_type: string
  }
  locations: string[]
  competitors: string[]
  logo_url: string
  imagery_urls: string[]
}

const INDUSTRIES = [
  'Technology', 'E-commerce', 'Healthcare', 'Finance', 'Education',
  'Real Estate', 'Food & Beverage', 'Fashion', 'Marketing & Agency',
  'Professional Services', 'Manufacturing', 'Other'
]

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [newLocation, setNewLocation] = useState('')
  const [newCompetitor, setNewCompetitor] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const [data, setData] = useState<OnboardingData>({
    name: '',
    description: '',
    product_or_service: '',
    what_they_sell: '',
    industry: '',
    target_audience: '',
    demographics: {
      gender: '',
      age_range: '',
      income_range: '',
      location_type: '',
    },
    locations: [],
    competitors: [],
    logo_url: '',
    imagery_urls: [],
  })

  function update(field: keyof OnboardingData, value: unknown) {
    setData(prev => ({ ...prev, [field]: value }))
  }

  function updateDemographic(field: string, value: string) {
    setData(prev => ({
      ...prev,
      demographics: { ...prev.demographics, [field]: value }
    }))
  }

  function addLocation() {
    if (newLocation.trim()) {
      update('locations', [...data.locations, newLocation.trim()])
      setNewLocation('')
    }
  }

  function removeLocation(i: number) {
    update('locations', data.locations.filter((_, idx) => idx !== i))
  }

  function addCompetitor() {
    if (newCompetitor.trim() && data.competitors.length < 3) {
      update('competitors', [...data.competitors, newCompetitor.trim()])
      setNewCompetitor('')
    }
  }

  function removeCompetitor(i: number) {
    update('competitors', data.competitors.filter((_, idx) => idx !== i))
  }

  async function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const ext = file.name.split('.').pop()
      const path = `${user.id}/logo-${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('business-assets').upload(path, file)
      if (error) throw error
      const { data: urlData } = supabase.storage.from('business-assets').getPublicUrl(path)
      update('logo_url', urlData.publicUrl)
    } catch (err) {
      console.error('Logo upload failed:', err)
    } finally {
      setUploadingLogo(false)
    }
  }

  async function uploadImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploadingImages(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const urls: string[] = []
      for (const file of files) {
        const ext = file.name.split('.').pop()
        const path = `${user.id}/imagery-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error } = await supabase.storage.from('business-assets').upload(path, file)
        if (error) throw error
        const { data: urlData } = supabase.storage.from('business-assets').getPublicUrl(path)
        urls.push(urlData.publicUrl)
      }
      update('imagery_urls', [...data.imagery_urls, ...urls])
    } catch (err) {
      console.error('Image upload failed:', err)
    } finally {
      setUploadingImages(false)
    }
  }

  async function handleSubmit() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from('businesses').insert({
        user_id: user.id,
        name: data.name,
        description: data.description,
        product_or_service: data.product_or_service || 'both',
        what_they_sell: data.what_they_sell,
        industry: data.industry,
        target_audience: data.target_audience,
        demographics: data.demographics,
        locations: data.locations,
        competitors: data.competitors,
        logo_url: data.logo_url,
        imagery_urls: data.imagery_urls,
        onboarding_complete: true,
      })

      if (error) throw error
      router.push('/dashboard')
    } catch (err) {
      console.error('Save failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1: return data.name && data.description && data.industry
      case 2: return data.what_they_sell && data.product_or_service
      case 3: return data.target_audience
      case 4: return data.locations.length > 0
      case 5: return data.competitors.length > 0
      case 6: return true
      default: return false
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg">Spun</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Progress */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div className={`flex items-center justify-center w-9 h-9 rounded-full border-2 transition-all ${
                  step > s.id
                    ? 'bg-purple-600 border-purple-600'
                    : step === s.id
                    ? 'border-purple-500 bg-purple-500/20'
                    : 'border-white/20 bg-white/5'
                }`}>
                  {step > s.id ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <s.icon className={`w-4 h-4 ${step === s.id ? 'text-purple-400' : 'text-slate-500'}`} />
                  )}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 w-8 sm:w-16 mx-1 transition-all ${step > s.id ? 'bg-purple-600' : 'bg-white/10'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <p className="text-slate-400 text-sm">Step {step} of {STEPS.length}: <span className="text-white font-medium">{STEPS[step-1].title}</span></p>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">

          {/* Step 1: Business Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">Tell me about your business</h2>
                <p className="text-slate-400">We'll use this to personalise your entire marketing strategy.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Business Name</label>
                  <input
                    value={data.name}
                    onChange={e => update('name', e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Business Description</label>
                  <textarea
                    value={data.description}
                    onChange={e => update('description', e.target.value)}
                    placeholder="Describe what your business does, your mission, and what makes you unique..."
                    rows={4}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Industry</label>
                  <select
                    value={data.industry}
                    onChange={e => update('industry', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select an industry</option>
                    {INDUSTRIES.map(ind => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: What You Sell */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">What do you sell?</h2>
                <p className="text-slate-400">Help us understand your offering so we can tailor the right marketing approach.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">Type of offering</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['product', 'service', 'both'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => update('product_or_service', type)}
                        className={`py-3 px-4 rounded-lg border-2 font-medium capitalize transition-all ${
                          data.product_or_service === type
                            ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                            : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Describe what you sell</label>
                  <textarea
                    value={data.what_they_sell}
                    onChange={e => update('what_they_sell', e.target.value)}
                    placeholder="e.g. We sell project management software for construction companies, starting at £99/month..."
                    rows={4}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Audience */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">Who will buy your {data.product_or_service || 'offering'}?</h2>
                <p className="text-slate-400">The more detail you give, the more targeted your campaigns will be.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Target audience description</label>
                  <textarea
                    value={data.target_audience}
                    onChange={e => update('target_audience', e.target.value)}
                    placeholder="e.g. B2B: Construction project managers and site owners at companies with 10-200 employees..."
                    rows={3}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Primarily</label>
                    <select
                      value={data.demographics.gender}
                      onChange={e => updateDemographic('gender', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Any gender</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Mixed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Age Range</label>
                    <select
                      value={data.demographics.age_range}
                      onChange={e => updateDemographic('age_range', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Any age</option>
                      <option>18-24</option>
                      <option>25-34</option>
                      <option>35-44</option>
                      <option>45-54</option>
                      <option>55-64</option>
                      <option>65+</option>
                      <option>Mixed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Income Range</label>
                    <select
                      value={data.demographics.income_range}
                      onChange={e => updateDemographic('income_range', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Unknown</option>
                      <option>Under £25k</option>
                      <option>£25k - £50k</option>
                      <option>£50k - £100k</option>
                      <option>£100k+</option>
                      <option>Enterprise</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Location Type</label>
                    <select
                      value={data.demographics.location_type}
                      onChange={e => updateDemographic('location_type', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Any</option>
                      <option>Urban</option>
                      <option>Suburban</option>
                      <option>Rural</option>
                      <option>National</option>
                      <option>International</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Locations */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">Where do you sell?</h2>
                <p className="text-slate-400">Add all the locations where you operate or sell your {data.product_or_service || 'offering'}.</p>
              </div>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    value={newLocation}
                    onChange={e => setNewLocation(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addLocation()}
                    placeholder="e.g. London, UK / Online worldwide / Manchester"
                    className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={addLocation}
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.locations.map((loc, i) => (
                    <span key={i} className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm">
                      <MapPin className="w-3 h-3" />
                      {loc}
                      <button onClick={() => removeLocation(i)}>
                        <X className="w-3 h-3 hover:text-white" />
                      </button>
                    </span>
                  ))}
                </div>
                {data.locations.length === 0 && (
                  <p className="text-slate-500 text-sm italic">Add at least one location to continue</p>
                )}
                <div className="p-4 bg-slate-800/50 rounded-lg text-sm text-slate-400">
                  <p className="font-medium text-slate-300 mb-1">Examples:</p>
                  <p>• "Online — UK only" &nbsp;• "London, Manchester, Birmingham" &nbsp;• "Global / Worldwide"</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Competitors */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">Your top 3 competitors</h2>
                <p className="text-slate-400">We'll analyse the competitive landscape to position your campaigns effectively.</p>
              </div>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    value={newCompetitor}
                    onChange={e => setNewCompetitor(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCompetitor()}
                    placeholder="Competitor name or website"
                    disabled={data.competitors.length >= 3}
                    className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-40"
                  />
                  <button
                    onClick={addCompetitor}
                    disabled={data.competitors.length >= 3}
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors disabled:opacity-40"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-2">
                  {data.competitors.map((comp, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-xs font-bold">
                          {i + 1}
                        </div>
                        <span className="text-white">{comp}</span>
                      </div>
                      <button onClick={() => removeCompetitor(i)}>
                        <X className="w-4 h-4 text-slate-400 hover:text-white" />
                      </button>
                    </div>
                  ))}
                  {data.competitors.length === 0 && (
                    <p className="text-slate-500 text-sm italic">Add at least one competitor to continue</p>
                  )}
                </div>
                <p className="text-sm text-slate-500">Add up to 3 competitors</p>
              </div>
            </div>
          )}

          {/* Step 6: Brand Assets */}
          {step === 6 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">Upload your brand assets</h2>
                <p className="text-slate-400">Your logo and brand imagery will inform the style and tone of your ad creatives.</p>
              </div>
              <div className="space-y-6">
                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">Logo</label>
                  <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                    data.logo_url ? 'border-purple-500/50 bg-purple-500/5' : 'border-white/20 hover:border-white/30 bg-white/2'
                  }`}>
                    <input type="file" className="hidden" accept="image/*" onChange={uploadLogo} />
                    {uploadingLogo ? (
                      <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                    ) : data.logo_url ? (
                      <div className="text-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={data.logo_url} alt="Logo" className="h-20 object-contain mx-auto mb-2" />
                        <p className="text-xs text-purple-400">Click to change</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                        <p className="text-sm text-slate-400">Click to upload logo</p>
                        <p className="text-xs text-slate-600 mt-1">PNG, JPG, SVG up to 10MB</p>
                      </div>
                    )}
                  </label>
                </div>

                {/* Brand Imagery */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">Brand Imagery <span className="text-slate-500 font-normal">(optional)</span></label>
                  <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                    data.imagery_urls.length > 0 ? 'border-purple-500/50 bg-purple-500/5' : 'border-white/20 hover:border-white/30'
                  }`}>
                    <input type="file" className="hidden" accept="image/*" multiple onChange={uploadImages} />
                    {uploadingImages ? (
                      <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                    ) : (
                      <div className="text-center">
                        <Upload className="w-6 h-6 text-slate-500 mx-auto mb-1" />
                        <p className="text-sm text-slate-400">{data.imagery_urls.length > 0 ? `${data.imagery_urls.length} image(s) uploaded — add more` : 'Upload brand photos'}</p>
                      </div>
                    )}
                  </label>
                  {data.imagery_urls.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {data.imagery_urls.map((url, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={i} src={url} alt="" className="w-16 h-16 object-cover rounded-lg border border-white/10" />
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-amber-400 text-sm">
                    <strong>You can skip this step</strong> — assets can be added later from your dashboard. However, uploading now helps Claude generate more on-brand ad creatives.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 1}
            className="flex items-center gap-2 px-6 py-2.5 text-slate-400 hover:text-white disabled:opacity-0 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {step < STEPS.length ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Launch Dashboard</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
