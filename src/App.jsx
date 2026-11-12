import { useEffect, useRef, useState } from 'react'
import andemLogo from './assets/andemlogo.png'
import { supabase } from './supabase'

const DEFAULT_CONTENT = {
  highlights: [
    {
      icon: '✳',
      title: 'Deneyimli kadromuz',
      description:
        'Kendine “EN İYİ” olmayı misyon edinen kurum, bünyesinde barındırdığı kalifiye eğitmenler ile hizmetine devam etmektedir.',
      image:
        'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=85',
      alt: 'Katılımcılarla eğitim çalışması',
    },
    {
      icon: '↗',
      title: 'İnovatif yaklaşım',
      description:
        'İnovatif çözümler ile eğitimlerini uygulanabilir ve uygulama ağırlıklı olarak yapan kurum, %100 başarıyı hedeflemektedir.',
      image:
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=85',
      alt: 'Birlikte uygulama yapan eğitim katılımcıları',
    },
    {
      icon: '◇',
      title: 'Proje Yönetimi',
      description:
        'Türkiye’de “HERKES BİR GÜN ANDEM İLE ÇALIŞACAK” ilkesi ile yola çıkan kurum tüm ülkede “İHTİYACA YÖNELİK” eğitim vermeye devam etmektedir.',
      image:
        'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=900&q=85',
      alt: 'Birlikte çalışan kurum ekibi',
    },
  ],
  programs: [
  {
    icon: '↗',
    title: 'Eğitim Programları',
    description:
      'Öğrenme hedeflerinize ve ihtiyaçlarınıza uygun eğitim çalışmalarımızı keşfedin.',
  },
  {
    icon: '✳',
    title: 'Bireysel Gelişim',
    description:
      'Kendinizi geliştirme yolculuğunuzda size rehberlik edecek fırsatları birlikte değerlendirelim.',
  },
  {
    icon: '◇',
    title: 'Kurumsal Çözümler',
    description:
      'Kurumların gelişim hedeflerine yönelik eğitim ve iş birliği seçenekleri hakkında konuşalım.',
  },
  ],
  principles: [
    { icon: '✓', title: 'İhtiyaca uygun', description: 'Her öğrenme yolculuğu farklıdır; doğru adımları birlikte belirleriz.' },
    { icon: '↗', title: 'Gelişim odaklı', description: 'Öğrenmeyi kalıcı gelişimin ve yeni fırsatların başlangıcı görürüz.' },
    { icon: '✳', title: 'Güvenilir iletişim', description: 'Sürecin her aşamasında açık, ulaşılabilir ve destekleyici oluruz.' },
  ],
}

const CONTENT_STORAGE_KEY = 'andem-site-content-v1'

const OFFICE_LOCATIONS = {
  antalya: {
    city: 'Antalya',
    office: 'ANTALYA ŞUBESİ',
    mapQuery: '36.88963802303863,30.688483039795862',
  },
  izmir: {
    city: 'İzmir',
    office: 'İZMİR ŞUBESİ',
    mapQuery: 'İsmet Kaptan Mahallesi 1372 Sokak Nükhet Hanım İş Merkezi No 15 D 13 14 Konak İzmir',
  },
}

const CONTENT_COLLECTIONS = [
  {
    key: 'highlights',
    title: 'Öne çıkan kartlar',
    fields: [
      { name: 'title', label: 'Başlık', required: true },
      { name: 'description', label: 'Açıklama', required: true },
      { name: 'icon', label: 'Sembol', required: true },
      { name: 'image', label: 'Görsel dosyası', required: true, type: 'file', accept: 'image/*' },
    ],
  },
  {
    key: 'programs',
    title: 'Eğitim kartları',
    fields: [
      { name: 'title', label: 'Başlık', required: true },
      { name: 'description', label: 'Açıklama', required: true },
      { name: 'icon', label: 'Sembol', required: true },
    ],
  },
  {
    key: 'principles',
    title: 'Yaklaşım kartları',
    fields: [
      { name: 'title', label: 'Başlık', required: true },
      { name: 'description', label: 'Açıklama', required: true },
      { name: 'icon', label: 'Sembol', required: true },
    ],
  },
]

function readSavedContent() {
  try {
    const saved = localStorage.getItem(CONTENT_STORAGE_KEY)
    if (!saved) return { content: DEFAULT_CONTENT, message: '' }

    const parsed = JSON.parse(saved)
    const content = Object.fromEntries(
      CONTENT_COLLECTIONS.map(({ key }) => {
        const collection = parsed[key]
        const validItems = Array.isArray(collection)
          ? collection.filter(
              (item) =>
                item &&
                typeof item === 'object' &&
                typeof item.title === 'string' &&
                typeof item.description === 'string' &&
                typeof item.icon === 'string' &&
                (key !== 'highlights' ||
                  (typeof item.image === 'string' && typeof item.alt === 'string')),
            )
          : DEFAULT_CONTENT[key]

        return [key, validItems]
      }),
    )

    return { content, message: '' }
  } catch {
    return {
      content: DEFAULT_CONTENT,
      message: 'Kayıtlı içerik okunamadı. Varsayılan içerik gösteriliyor.',
    }
  }
}

async function convertImageToDataUrl(file) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Lütfen bir görsel dosyası seçin.')
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Görsel dosyası 10 MB’tan küçük olmalıdır.')
  }

  const image = await createImageBitmap(file)
  const scale = Math.min(1, 1600 / Math.max(image.width, image.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.width * scale))
  canvas.height = Math.max(1, Math.round(image.height * scale))
  const context = canvas.getContext('2d')
  if (!context) {
    image.close()
    throw new Error('Görsel işlenemedi. Başka bir dosya deneyin.')
  }
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  image.close()

  const compressedImage = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Görsel sıkıştırılamadı. Başka bir dosya deneyin.'))
      },
      'image/webp',
      0.82,
    )
  })

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Görsel okunamadı. Başka bir dosya deneyin.'))
    reader.readAsDataURL(compressedImage)
  })
}

function AdminCollection({ collection, items, onAdd, onUpdate, onDelete }) {
  const [editingItemId, setEditingItemId] = useState(null)
  const [addError, setAddError] = useState('')
  const [editError, setEditError] = useState('')
  const [saving, setSaving] = useState(false)

  const getFormFields = async (formData, preserveEmptyFiles = false) => {
    const fields = {}
    for (const field of collection.fields) {
      const value = formData.get(field.name)
      if (field.type === 'file') {
        if (value instanceof File && value.size > 0) {
          fields[field.name] = await convertImageToDataUrl(value)
        } else if (!preserveEmptyFiles) {
          fields[field.name] = ''
        }
      } else {
        fields[field.name] = String(value || '').trim()
      }
    }
    return fields
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    setAddError('')
    setSaving(true)
    try {
      const item = await getFormFields(new FormData(form))
      onAdd(collection.key, {
        ...item,
        id: crypto.randomUUID(),
        ...(collection.key === 'highlights' ? { alt: item.title } : {}),
      })
      form.reset()
    } catch (error) {
      console.error('Görsel yüklenemedi.', error)
      setAddError(error.message || 'Görsel yüklenemedi. Başka bir dosya deneyin.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (event, existingItem) => {
    event.preventDefault()
    const form = event.currentTarget
    setEditError('')
    setSaving(true)
    try {
      const changes = await getFormFields(new FormData(form), true)
      onUpdate(collection.key, existingItem.id || existingItem.title, {
        ...existingItem,
        ...changes,
        ...(collection.key === 'highlights' ? { alt: changes.title } : {}),
      })
      setEditingItemId(null)
    } catch (error) {
      console.error('Görsel güncellenemedi.', error)
      setEditError(error.message || 'Görsel güncellenemedi. Başka bir dosya deneyin.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="admin-collection">
      <div className="admin-collection-heading">
        <div>
          <span className="admin-kicker">{items.length} KART</span>
          <h2>{collection.title}</h2>
        </div>
      </div>
      <form className="admin-add-form" onSubmit={handleSubmit}>
        {collection.fields.map((field) => (
          <label className={field.name === 'description' ? 'admin-field-wide' : ''} key={field.name}>
            {field.label}
            <input
              name={field.name}
              type={field.type || 'text'}
              required={field.required}
              accept={field.accept}
            />
          </label>
        ))}
        <button className="admin-button admin-button-primary" type="submit" disabled={saving}>
          {saving ? 'Yükleniyor…' : 'Kart ekle'}
        </button>
      </form>
      {addError && <p className="admin-form-error" role="alert">{addError}</p>}
      <div className="admin-item-list">
        {items.map((item) => (
          <article className="admin-item" key={item.id || item.title}>
            {editingItemId === (item.id || item.title) ? (
              <form
                className="admin-edit-form"
                key={`${collection.key}-${editingItemId}`}
                onSubmit={(event) => handleUpdate(event, item)}
              >
                {item.image && (
                  <img className="admin-edit-image" src={item.image} alt={`${item.title} mevcut görseli`} />
                )}
                {collection.fields.map((field) => (
                  <label className={field.name === 'description' ? 'admin-field-wide' : ''} key={field.name}>
                    {field.label}
                    <input
                      name={field.name}
                      type={field.type || 'text'}
                      accept={field.accept}
                      defaultValue={field.type === 'file' ? undefined : item[field.name] || ''}
                      required={field.type === 'file' ? false : field.required}
                    />
                  </label>
                ))}
                {editError && <p className="admin-form-error admin-field-wide" role="alert">{editError}</p>}
                <div className="admin-edit-actions">
                  <button className="admin-button admin-button-primary" type="submit" disabled={saving}>
                    {saving ? 'Yükleniyor…' : 'Kaydet'}
                  </button>
                  <button className="admin-button" type="button" onClick={() => setEditingItemId(null)}>
                    İptal
                  </button>
                </div>
              </form>
            ) : (
              <>
                {item.image && (
                  <img className="admin-item-image" src={item.image} alt="" />
                )}
                <span className="admin-item-icon" aria-hidden="true">{item.icon}</span>
                <div className="admin-item-copy">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
                <div className="admin-item-actions">
                  <button
                    className="admin-button admin-button-edit"
                    type="button"
                    onClick={() => setEditingItemId(item.id || item.title)}
                    aria-label={`${item.title} kartını düzenle`}
                  >
                    Düzenle
                  </button>
                  <button
                    className="admin-button admin-button-delete"
                    type="button"
                    onClick={() => onDelete(collection.key, item.id || item.title)}
                    aria-label={`${item.title} kartını sil`}
                  >
                    Sil
                  </button>
                </div>
              </>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

function AdminPage({ content, onAdd, onUpdate, onDelete, onReset, storageMessage }) {
  const [selectedCollectionKey, setSelectedCollectionKey] = useState(CONTENT_COLLECTIONS[0].key)
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(Boolean(supabase))
  const [authError, setAuthError] = useState('')
  const [signingIn, setSigningIn] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const emailInputRef = useRef(null)
  const passwordInputRef = useRef(null)
  const selectedCollection = CONTENT_COLLECTIONS.find(
    (collection) => collection.key === selectedCollectionKey,
  )

  useEffect(() => {
    if (!supabase) return undefined

    let active = true
    const initializeAuth = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (!active) return
      if (error) {
        setAuthError('Oturum bilgisi alınamadı. Lütfen sayfayı yenileyin.')
      } else {
        setSession(data.session)
      }
      setAuthLoading(false)
    }

    initializeAuth()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setAuthError('')
      setAuthLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const handleSignIn = async (event) => {
    event.preventDefault()
    setSigningIn(true)
    setAuthError('')
    if (!supabase) {
      setAuthError('Giriş servisi yapılandırılmamış. Lütfen site yöneticisiyle iletişime geçin.')
      setSigningIn(false)
      return
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) setAuthError('Giriş başarısız. E-posta ve şifrenizi kontrol edin.')
    } catch (error) {
      console.error('Supabase yönetici girişi başarısız oldu.', error)
      setAuthError('Giriş sırasında bağlantı hatası oluştu. Lütfen tekrar deneyin.')
    } finally {
      setSigningIn(false)
    }
  }

  const handleSignOut = async () => {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) setAuthError('Oturum kapatılamadı. Lütfen tekrar deneyin.')
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <a className="admin-brand" href="/">ANDEM <span>YÖNETİM</span></a>
        {session ? (
          <div className="admin-account-actions">
            <a className="admin-home-link" href="/">Siteyi görüntüle</a>
            <button className="admin-button" type="button" onClick={handleSignOut}>Çıkış yap</button>
          </div>
        ) : (
          <a className="admin-home-link" href="/">Siteyi görüntüle</a>
        )}
      </header>
      {supabase && authLoading ? (
        <div className="admin-login-wrap">
          <p className="admin-auth-status" role="status">Oturum kontrol ediliyor…</p>
        </div>
      ) : !session ? (
        <div className="admin-login-wrap">
          <section className="admin-login-card" aria-labelledby="admin-auth-title">
            <span className="admin-kicker">GÜVENLİ YÖNETİCİ GİRİŞİ</span>
            <h1 id="admin-auth-title">Yönetim paneli</h1>
            <p>Devam etmek için Supabase hesabınızla giriş yapın.</p>
            <form className="admin-login-form" onSubmit={handleSignIn}>
              <label>
                E-posta
                <span className="admin-login-input-row">
                  <input
                    ref={emailInputRef}
                    name="email"
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      setAuthError('')
                    }}
                    required
                  />
                  <button
                    className="admin-input-clear"
                    type="button"
                    onClick={() => {
                      setEmail('')
                      setAuthError('')
                      emailInputRef.current?.focus()
                    }}
                    aria-label="E-posta alanını temizle"
                    title="Temizle"
                  >
                    ×
                  </button>
                </span>
              </label>
              <label>
                Şifre
                <span className="admin-login-input-row">
                  <input
                    ref={passwordInputRef}
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value)
                      setAuthError('')
                    }}
                    required
                  />
                  <button
                    className="admin-input-clear"
                    type="button"
                    onClick={() => {
                      setPassword('')
                      setAuthError('')
                      passwordInputRef.current?.focus()
                    }}
                    aria-label="Şifre alanını temizle"
                    title="Temizle"
                  >
                    ×
                  </button>
                </span>
              </label>
              {authError && <p className="admin-auth-error" role="alert">{authError}</p>}
              <button className="admin-button admin-button-primary" type="submit" disabled={signingIn}>
                {signingIn ? 'Kontrol ediliyor…' : 'Giriş yap'}
              </button>
            </form>
          </section>
        </div>
      ) : (
      <div className="admin-main">
        <div className="admin-intro">
          <div>
            <span className="admin-kicker">İÇERİK YÖNETİMİ</span>
            <h1>Sayfa kartlarını yönetin</h1>
            <p>Kart ekleyin, düzenleyin veya kaldırın. Değişiklikler bu tarayıcıda saklanır.</p>
          </div>
          <button className="admin-button admin-button-reset" type="button" onClick={onReset}>
            Varsayılanlara dön
          </button>
        </div>
        <div className="admin-storage-notice" role="status">
          {storageMessage || 'Giriş Supabase Auth ile doğrulanır. Kart içerikleri ve yüklenen görseller bu tarayıcıda saklanır.'}
        </div>
        <nav className="admin-section-picker" aria-label="Yönetilecek bölümü seçin">
          {CONTENT_COLLECTIONS.map((collection) => (
            <button
              className={`admin-section-option${collection.key === selectedCollectionKey ? ' is-active' : ''}`}
              key={collection.key}
              type="button"
              aria-pressed={collection.key === selectedCollectionKey}
              onClick={() => setSelectedCollectionKey(collection.key)}
            >
              <span>{collection.title}</span>
              <span className="admin-section-count">{content[collection.key].length}</span>
            </button>
          ))}
        </nav>
        <AdminCollection
          collection={selectedCollection}
          items={content[selectedCollection.key]}
          onAdd={onAdd}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      </div>
      )}
    </main>
  )
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedOffice, setSelectedOffice] = useState('antalya')
  const [savedContent, setSavedContent] = useState(readSavedContent)
  const [storageMessage, setStorageMessage] = useState(savedContent.message)
  const isAdminRoute = window.location.pathname.replace(/\/+$/, '') === '/admin'
  const { content } = savedContent
  const officeLocation = OFFICE_LOCATIONS[selectedOffice]

  useEffect(() => {
    let active = true
    try {
      localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(content))
    } catch (error) {
      console.error('ANDEM içerik değişiklikleri tarayıcıya kaydedilemedi.', error)
      queueMicrotask(() => {
        if (active) {
          setStorageMessage('Değişiklikler tarayıcıya kaydedilemedi. Tarayıcı depolama alanınızı kontrol edin.')
        }
      })
    }
    return () => {
      active = false
    }
  }, [content])

  useEffect(() => {
    if (isAdminRoute) return
    const revealItems = document.querySelectorAll('.reveal')

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      revealItems.forEach((item) => item.classList.add('is-visible'))
      return
    }

    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            currentObserver.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.14, rootMargin: '0px 0px -35px 0px' },
    )

    revealItems.forEach((item) => observer.observe(item))
    return () => observer.disconnect()
  }, [isAdminRoute])

  const updateContent = (updater) => {
    setSavedContent((current) => ({
      content: updater(current.content),
      message: '',
    }))
  }

  const addItem = (key, item) => {
    updateContent((current) => ({
      ...current,
      [key]: [...current[key], item],
    }))
  }

  const updateItem = (key, itemId, updatedItem) => {
    updateContent((current) => ({
      ...current,
      [key]: current[key].map((item) =>
        (item.id || item.title) === itemId ? updatedItem : item,
      ),
    }))
  }

  const deleteItem = (key, itemId) => {
    updateContent((current) => ({
      ...current,
      [key]: current[key].filter((item) => (item.id || item.title) !== itemId),
    }))
  }

  const resetContent = () => {
    if (!window.confirm('Tüm kart değişiklikleri silinip varsayılan içerik yüklensin mi?')) return
    updateContent(() => DEFAULT_CONTENT)
  }

  if (isAdminRoute) {
    return (
      <AdminPage
        content={content}
        onAdd={addItem}
        onUpdate={updateItem}
        onDelete={deleteItem}
        onReset={resetContent}
        storageMessage={storageMessage}
      />
    )
  }

  const closeMenu = () => setMenuOpen(false)

  const handleContactSubmit = (event) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const subject = encodeURIComponent(`ANDEM web sitesi iletişim: ${formData.get('subject')}`)
    const body = encodeURIComponent(
      `Ad Soyad: ${formData.get('name')}\nE-posta: ${formData.get('email')}\nTelefon: ${formData.get('phone') || 'Belirtilmedi'}\n\nMesaj:\n${formData.get('message')}`,
    )

    window.location.href = `mailto:info@andem.com.tr?subject=${subject}&body=${body}`
  }

  return (
    <div className="website">
      <div className="header-contact-bar">
        <div className="container header-contact-bar-inner">
          <div className="header-contact">
            <a href="mailto:info@andem.com.tr">
              <span className="header-contact-icon" aria-hidden="true">@</span>
              <span>info@andem.com.tr</span>
            </a>
            <a href="tel:+902422421992">
              <span className="header-contact-icon" aria-hidden="true">☎</span>
              <span>0 (242) 242 19 92</span>
            </a>
            <a href="tel:+902325044929">
              <span className="header-contact-icon" aria-hidden="true">☎</span>
              <span>0 (232) 504 49 29</span>
            </a>
          </div>
        </div>
      </div>
      <header className="site-header">
        <div className="header-top">
          <div className="container header-top-inner">
            <a className="brand" href="#anasayfa" aria-label="ANDEM ana sayfa" onClick={closeMenu}>
              <img className="brand-logo" src={andemLogo} alt="ANDEM Eğitim Merkezi" />
            </a>
            <div className="nav">
            <button
              className="menu-toggle"
              type="button"
              aria-label={menuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
              aria-expanded={menuOpen}
              aria-controls="primary-navigation"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <span />
              <span />
            </button>

            <nav
              className={`menu${menuOpen ? ' is-open' : ''}`}
              id="primary-navigation"
              aria-label="Ana menü"
            >
              <a href="#anasayfa" onClick={closeMenu}>Anasayfa</a>
              <a href="#hakkimizda" onClick={closeMenu}>Hakkımızda</a>
              <a href="#egitimler" onClick={closeMenu}>Eğitimlerimiz</a>
              <a href="#yaklasimimiz" onClick={closeMenu}>Neden ANDEM</a>
              <a href="#iletisim" onClick={closeMenu}>İletişim</a>
            </nav>

            <a className="header-cta" href="#iletisim">
              Teklif İste
            </a>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="hero" id="anasayfa">
          <div className="hero-image" aria-hidden="true" />
          <div className="hero-shade" aria-hidden="true" />
          <div className="container hero-content">
            <div className="hero-copy">
              <span className="eyebrow hero-eyebrow">
                <span className="eyebrow-line" />
                ANDEM EĞİTİM MERKEZİ
              </span>
              <h1>
                Öğren,
                <br />
                <span>geliş,</span> geleceğini
                <br className="desktop-break" /> şekillendir.
              </h1>
              <p>
                Her yeni bilgi, geleceğe atılan güçlü bir adımdır.
                Eğitim ve gelişim yolculuğunuzda yanınızdayız.
              </p>
              <div className="hero-actions">
                <a className="button button-gold" href="#egitimler">
                  Eğitimlerimizi Keşfedin
                </a>
                <a className="button button-link" href="#hakkimizda">
                  ANDEM’i Tanıyın
                </a>
              </div>
            </div>
          </div>
          <div className="hero-bottom container">
            <span>ANDEM EĞİTİM MERKEZİ</span>
            <a href="#andem-fark" aria-label="ANDEM'in farkını keşfedin"><span aria-hidden="true">↓</span></a>
          </div>
        </section>

        <section className="highlights" id="andem-fark">
          <div className="container highlight-grid">
            {content.highlights.map((highlight) => (
              <article className="highlight-card reveal" key={highlight.id || highlight.title}>
                <div className="highlight-image">
                  <img src={highlight.image} alt={highlight.alt || highlight.title} loading="lazy" />
                  <span className="highlight-icon" aria-hidden="true">{highlight.icon}</span>
                </div>
                <div className="highlight-copy">
                  <h2>{highlight.title}</h2>
                  <p>{highlight.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="intro section" id="hakkimizda">
          <div className="container">
            <div className="section-label">
              <span className="eyebrow">HAKKIMIZDA</span>
              <span className="label-rule" />
            </div>
            <div className="intro-grid reveal">
              <h2>
                Güçlü bir gelecek,
                <br />
                <span>öğrenmeye açık</span>
                <br />
                zihinlerle başlar.
              </h2>
              <div className="intro-copy">
                <p>
                  ANDEM olarak eğitim ve gelişimi, potansiyeli ortaya çıkaran
                  değerli bir yolculuk olarak görüyoruz. İhtiyaçlarınızı
                  anlayan, hedeflerinize eşlik eden bir yaklaşımla yanınızdayız.
                </p>
                <a className="text-link" href="#yaklasimimiz">
                  Yaklaşımımızı keşfedin <span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>
            <div className="intro-stamp" aria-hidden="true"><br /></div>
          </div>
        </section>

        <section className="programs section" id="egitimler">
          <div className="container">
            <div className="section-heading">
              <div className="reveal">
                <span className="eyebrow">EĞİTİMLER</span>
                <h2>Gelişim yolculuğunuz<br /><span>burada başlıyor.</span></h2>
              </div>
              <p>
                Eğitim programlarımızı ve gelişim çalışmalarımızı yakından
                tanıyın; sizin için en uygun yolu birlikte belirleyelim.
              </p>
            </div>

            <div className="program-grid">
              {content.programs.map((program) => (
                <article className="program-card reveal" key={program.id || program.title}>
                  <div className="program-card-top">
                    <span className="card-icon" aria-hidden="true">{program.icon}</span>
                  </div>
                  <h3>{program.title}</h3>
                  <p>{program.description}</p>
                  <a href="#iletisim" aria-label={`${program.title} hakkında bilgi alın`}>
                    Bilgi alın <span aria-hidden="true">↗</span>
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="approach section" id="yaklasimimiz">
          <div className="container approach-grid">
            <div className="approach-visual reveal">
              <div className="approach-image-wrap">
                <img
                  src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=85"
                  alt="Birlikte öğrenen katılımcılar"
                  loading="lazy"
                />
              </div>
              <div className="approach-visual-caption">
                <span className="approach-caption-label">ANDEM’DE</span>
                <strong>Her öğrenme adımı, geleceğe açılan yeni bir kapı.</strong>
              </div>
            </div>
            <div className="approach-copy reveal">
              <span className="eyebrow">BİZİ FARKLI KILAN</span>
              <h2>Öğrenmeyi<br /><span>birlikte</span> büyütüyoruz.</h2>
              <p className="approach-lead">
                İyi bir eğitim, doğru soruları sormakla ve kişiye değer vermekle başlar.
              </p>
              <div className="principle-list">
                {content.principles.map((principle) => (
                  <div className="principle" key={principle.id || principle.title}>
                    <span className="principle-icon" aria-hidden="true">{principle.icon}</span>
                    <div>
                      <h3>{principle.title}</h3>
                      <p>{principle.description}</p>
                    </div>
                    <span className="principle-arrow" aria-hidden="true">↗</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="invitation">
          <div className="invitation-art" aria-hidden="true">
            <span className="invitation-art-letter">A</span>
            <span className="invitation-art-caption">ÖĞREN · GELİŞ · İLERLE</span>
          </div>
          <div className="container invitation-content reveal">
            <span className="eyebrow">YENİ BİR BAŞLANGIÇ</span>
            <h2>Geleceğine<br /><span>bugün</span> yatırım yap.</h2>
            <p>ANDEM’in eğitim ve gelişim çalışmaları hakkında bilgi almak için bize ulaşın.</p>
            <a className="button button-dark" href="#iletisim">
              Birlikte başlayalım
            </a>
          </div>
        </section>

        <section className="contact section" id="iletisim">
          <div className="container">
            <div className="contact-heading reveal">
              <span className="eyebrow">İLETİŞİM</span>
              <h2>Size nasıl <span>yardımcı</span> olabiliriz?</h2>
              <p>
                Eğitimlerimiz ve iş birliği seçenekleri hakkında bize mesaj bırakın.
                Ekibimiz en kısa sürede sizinle iletişime geçsin.
              </p>
            </div>

            <div className="contact-grid">
              <form className="contact-form reveal" onSubmit={handleContactSubmit}>
                <div className="form-row">
                  <label>
                    <span>Ad Soyad <span className="required-mark" aria-hidden="true">*</span></span>
                    <input type="text" name="name" autoComplete="name" placeholder="Adınızı ve soyadınızı girin" required />
                  </label>
                  <label>
                    <span>E-posta <span className="required-mark" aria-hidden="true">*</span></span>
                    <input type="email" name="email" autoComplete="email" placeholder="ornek@eposta.com" required />
                  </label>
                </div>
                <div className="form-row">
                  <label>
                    <span>Telefon</span>
                    <input type="tel" name="phone" autoComplete="tel" placeholder="05xx xxx xx xx" />
                  </label>
                  <label>
                    <span>Konu <span className="required-mark" aria-hidden="true">*</span></span>
                    <select name="subject" defaultValue="" required>
                      <option value="" disabled>Konu seçin</option>
                      <option value="Eğitimler hakkında bilgi">Eğitimler hakkında bilgi</option>
                      <option value="Kurumsal eğitim talebi">Kurumsal eğitim talebi</option>
                      <option value="Diğer">Diğer</option>
                    </select>
                  </label>
                </div>
                <label>
                  <span>Mesajınız <span className="required-mark" aria-hidden="true">*</span></span>
                  <textarea name="message" rows="5" placeholder="Size nasıl yardımcı olabiliriz?" required />
                </label>
                <button className="button button-gold form-submit" type="submit">
                  Mesajınızı gönderin
                </button>
              </form>

              <div className="contact-map reveal">
                <div className="map-heading">
                  <div>
                    <span className="map-eyebrow">{officeLocation.office}</span>
                    <label className="map-city-picker">
                      <select
                        value={selectedOffice}
                        onChange={(event) => setSelectedOffice(event.target.value)}
                        aria-label="Şube seçin"
                      >
                        <option value="antalya">Antalya</option>
                        <option value="izmir">İzmir</option>
                      </select>
                    </label>
                  </div>
                  <span className="map-pin" aria-hidden="true">⌖</span>
                </div>
                <iframe
                  key={selectedOffice}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(officeLocation.mapQuery)}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                  title={`ANDEM ${officeLocation.city} ofis haritası`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-content">
          <div className="footer-about">
            <a className="brand footer-brand" href="#anasayfa">
              <img className="brand-logo" src={andemLogo} alt="ANDEM Eğitim Merkezi" />
            </a>
            <p>
              Antalya ve İzmir’de hizmet veren ANDEM, uzman eğitmen kadrosuyla
              kurumların ve katılımcıların eğitim ihtiyaçlarına yönelik çözümler sunar.
            </p>
            <div className="footer-socials" aria-label="Sosyal medya hesaplarımız">
              <a href="https://www.facebook.com/AndemEgitimMerkezi" target="_blank" rel="noreferrer" aria-label="Facebook">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 21v-8.2h2.8l.4-3.2h-3.2v-2c0-.9.3-1.6 1.6-1.6h1.7V3.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.3H7.3v3.2h2.8V21h3.4Z" /></svg>
              </a>
              <a href="https://www.instagram.com/andemegitim" target="_blank" rel="noreferrer" aria-label="Instagram">
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.2" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="4.1" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="17.7" cy="6.6" r="1.2" fill="currentColor" /></svg>
              </a>
              <a href="https://www.linkedin.com/company/andem" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5.2 8.6a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM3.5 10h3.4v10.5H3.5V10Zm5.5 0h3.3v1.4h.1c.5-.9 1.6-1.8 3.3-1.8 3.5 0 4.1 2.3 4.1 5.2v5.7h-3.5v-5c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7v5.1H9V10Z" /></svg>
              </a>
              <a href="https://www.youtube.com/channel/UCPhLjNSzbFltFWvdwabbQQg" target="_blank" rel="noreferrer" aria-label="YouTube">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4L15.8 12l-6.2 3.6Z" /></svg>
              </a>
            </div>
          </div>

          <div className="footer-column">
            <h2>Eğitimlerimiz</h2>
            <a href="#egitimler">İlk Yardım Eğitimi</a>
            <a href="#egitimler">İlk Yardım Eğitici Eğitimi</a>
            <a href="#egitimler">Yangın Eğitimi</a>
            <a href="#egitimler">Yüksekte Çalışma Eğitimi</a>
            <a href="#egitimler">Kurumsal Eğitimler</a>
          </div>

          <div className="footer-column">
            <h2>Kurumsal</h2>
            <a href="#hakkimizda">Hakkımızda</a>
            <a href="#yaklasimimiz">Neden ANDEM</a>
            <a href="#iletisim">Teklif İste</a>
            <a href="#iletisim">İletişim</a>
          </div>

          <div className="footer-column footer-contact">
            <h2>İletişim</h2>
            <h3>Merkez · Antalya</h3>
            <p>Varlık Mah. 100. Yıl Bulvarı Işıldar Apt. No:59 Kat:3 D:5 Muratpaşa / Antalya</p>
            <a href="tel:+902422421992">0 (242) 242 19 92</a>
            <h3>Şube · İzmir</h3>
            <p>İsmet Kaptan Mah. 1372 Sk. Nükhet Hanım İş Merkezi No:15 D:13-14 Konak / İzmir</p>
            <a href="tel:+902325044929">0 (232) 504 49 29</a>
            <a href="mailto:info@andem.com.tr">info@andem.com.tr</a>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="container footer-bottom-inner">
            <span>© {new Date().getFullYear()} ANDEM Eğitim Merkezi. Tüm hakları saklıdır.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
