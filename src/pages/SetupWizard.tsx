import { useState } from 'react';
import { useSiteConfig, createDefaultConfig } from '../config/SiteConfigContext';
import { type SiteConfig, type Genre, SUPPORTED_GENRES, SUPPORTED_LANGUAGES, getGenreMeta, siteConfigSchema } from '../config/site-config';

const STEPS = ['Genre', 'Identity', 'SEO', 'Providers', 'Review'] as const;

export function SetupWizard() {
  const { config, updateConfig } = useSiteConfig();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<SiteConfig>(
    config || createDefaultConfig('fiction')
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const updateDraft = (path: string, value: unknown) => {
    setDraft(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) {
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return next;
    });
    setErrors([]);
  };

  const handleGenreChange = (genre: Genre) => {
    const meta = getGenreMeta(genre);
    const defaults = createDefaultConfig(genre);
    setDraft(prev => ({
      ...prev,
      genre: { primary: genre, subgenres: meta.defaultSubgenres },
      site: { ...prev.site, name: defaults.site.name, slug: defaults.site.slug, description: meta.homepageCopy },
      seo: { ...defaults.seo },
    }));
  };

  const handleSave = async () => {
    const finalConfig = { ...draft, setupComplete: true };
    const result = siteConfigSchema.safeParse(finalConfig);
    if (!result.success) {
      setErrors(result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`));
      return;
    }
    setSaving(true);
    try {
      await updateConfig(result.data);
    } catch (e) {
      setErrors([e instanceof Error ? e.message : 'Failed to save']);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-2">📚 CPABOOK Setup</h1>
        <p className="text-center text-gray-500 mb-8">Configure your book catalog website</p>

        {/* Progress */}
        <div className="flex justify-center mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <button
                onClick={() => setStep(i)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  i === step ? 'bg-blue-600 text-white' : i < step ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {i < step ? '✓' : i + 1}
              </button>
              {i < STEPS.length - 1 && (
                <div className={`w-12 h-0.5 ${i < step ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-sm font-medium text-gray-700 mb-6">{STEPS[step]}</p>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          {/* Step 0: Genre */}
          {step === 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Choose your primary genre</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {SUPPORTED_GENRES.filter(g => g !== 'custom').map(g => {
                  const meta = getGenreMeta(g);
                  return (
                    <button
                      key={g}
                      onClick={() => handleGenreChange(g)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        draft.genre.primary === g
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl">{meta.emoji}</span>
                      <p className="font-medium mt-1">{meta.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 1: Identity */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold mb-4">Site Identity</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site Name *</label>
                <input
                  type="text"
                  value={draft.site.name}
                  onChange={e => updateDraft('site.name', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., RomanceBook"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site Slug *</label>
                <input
                  type="text"
                  value={draft.site.slug}
                  onChange={e => updateDraft('site.slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., romancebook"
                />
                <p className="text-xs text-gray-400 mt-1">Lowercase, alphanumeric, hyphens only</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  value={draft.site.description}
                  onChange={e => updateDraft('site.description', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe your book catalog..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                <select
                  value={draft.site.language}
                  onChange={e => updateDraft('site.language', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {SUPPORTED_LANGUAGES.map(l => (
                    <option key={l} value={l}>{l.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Production URL</label>
                <input
                  type="url"
                  value={draft.site.url}
                  onChange={e => updateDraft('site.url', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://yourdomain.com (leave empty for dev mode)"
                />
                <p className="text-xs text-gray-400 mt-1">Leave empty to use development mode</p>
              </div>
            </div>
          )}

          {/* Step 2: SEO */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold mb-4">SEO Settings</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title Template</label>
                <input
                  type="text"
                  value={draft.seo.titleTemplate}
                  onChange={e => updateDraft('seo.titleTemplate', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="%s | MySite"
                />
                <p className="text-xs text-gray-400 mt-1">Use %s for page title placeholder</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Title *</label>
                <input
                  type="text"
                  value={draft.seo.defaultTitle}
                  onChange={e => updateDraft('seo.defaultTitle', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description *</label>
                <textarea
                  value={draft.seo.description}
                  onChange={e => updateDraft('seo.description', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-gray-400 mt-1">{draft.seo.description.length}/500</p>
              </div>
            </div>
          )}

          {/* Step 3: Providers */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold mb-4">Data Providers</h2>
              <p className="text-sm text-gray-500 mb-4">Select which book data sources to enable.</p>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={draft.providers.openLibrary.enabled}
                    onChange={e => updateDraft('providers.openLibrary.enabled', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-medium">Open Library</p>
                    <p className="text-sm text-gray-500">Free, no API key required. Large catalog of public domain and modern books.</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={draft.providers.googleBooks.enabled}
                    onChange={e => updateDraft('providers.googleBooks.enabled', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-medium">Google Books</p>
                    <p className="text-sm text-gray-500">Requires API key (optional for low-volume). Comprehensive metadata.</p>
                  </div>
                </label>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Ingestion Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Batch Size</label>
                    <input
                      type="number"
                      value={draft.ingestion.batchSize}
                      onChange={e => updateDraft('ingestion.batchSize', parseInt(e.target.value) || 20)}
                      className="w-full px-3 py-2 border rounded-lg"
                      min={1}
                      max={100}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Max Books Per Run</label>
                    <input
                      type="number"
                      value={draft.ingestion.maxBooksPerRun}
                      onChange={e => updateDraft('ingestion.maxBooksPerRun', parseInt(e.target.value) || 100)}
                      className="w-full px-3 py-2 border rounded-lg"
                      min={1}
                      max={500}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Review Configuration</h2>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-gray-500">Genre:</span>
                  <span className="font-medium">{getGenreMeta(draft.genre.primary).emoji} {getGenreMeta(draft.genre.primary).label}</span>
                  <span className="text-gray-500">Site Name:</span>
                  <span className="font-medium">{draft.site.name}</span>
                  <span className="text-gray-500">Slug:</span>
                  <span className="font-medium">{draft.site.slug}</span>
                  <span className="text-gray-500">Language:</span>
                  <span className="font-medium">{draft.site.language.toUpperCase()}</span>
                  <span className="text-gray-500">URL:</span>
                  <span className="font-medium">{draft.site.url || '(Development mode)'}</span>
                  <span className="text-gray-500">Open Library:</span>
                  <span className="font-medium">{draft.providers.openLibrary.enabled ? '✅ Enabled' : '❌ Disabled'}</span>
                  <span className="text-gray-500">Google Books:</span>
                  <span className="font-medium">{draft.providers.googleBooks.enabled ? '✅ Enabled' : '❌ Disabled'}</span>
                </div>

                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    <strong>SEO Title:</strong> {draft.seo.defaultTitle}
                  </p>
                  <p className="text-blue-700 text-xs mt-1">{draft.seo.description}</p>
                </div>

                {draft.genre.subgenres.length > 0 && (
                  <div>
                    <span className="text-gray-500">Subgenres:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {draft.genre.subgenres.map(sg => (
                        <span key={sg} className="px-2 py-0.5 bg-gray-100 rounded text-xs">{sg}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {errors.length > 0 && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="font-medium text-red-700 mb-2">Validation Errors:</p>
                  <ul className="list-disc list-inside text-red-600 text-sm">
                    {errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex justify-between">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="px-6 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Complete Setup'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
