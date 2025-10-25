<template>
  <div class="landing-page">
    <!-- Navigation -->
    <nav class="nav">
      <div class="nav-container">
        <div class="nav-logo">
          <h2>🎵 Audio Normalizer</h2>
        </div>
        <div class="nav-actions">
          <router-link to="/app" class="btn-primary">
            {{ t('nav-app') }}
          </router-link>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero">
      <div class="container">
        <div class="hero-content">
          <h1 class="hero-title">{{ t('hero-title') }}</h1>
          <p class="hero-subtitle">{{ t('hero-subtitle') }}</p>
          <p class="hero-description">{{ t('hero-description') }}</p>
          <router-link to="/app" class="btn-hero">
            {{ t('hero-cta') }} →
          </router-link>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features">
      <div class="container">
        <h2 class="section-title">{{ t('features-title') }}</h2>
        <div class="features-grid">
          <div 
            v-for="feature in features" 
            :key="feature.titleKey"
            class="feature-card"
            :class="`feature-${feature.type}`"
          >
            <div class="feature-icon">{{ feature.icon }}</div>
            <h3>{{ t(feature.titleKey) }}</h3>
            <p>{{ t(feature.descKey) }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Benefits Section -->
    <section class="benefits">
      <div class="container">
        <h2 class="section-title">{{ t('benefits-title') }}</h2>
        <div class="benefits-grid">
          <div 
            v-for="benefit in benefits" 
            :key="benefit.titleKey"
            class="benefit-card"
          >
            <h3>{{ t(benefit.titleKey) }}</h3>
            <p>{{ t(benefit.descKey) }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section class="faq">
      <div class="container">
        <h2 class="section-title">{{ t('faq-title') }}</h2>
        <div class="faq-list">
          <div 
            v-for="faq in faqs" 
            :key="faq.questionKey"
            class="faq-item"
            :class="{ 'faq-open': faq.isOpen }"
          >
            <button 
              class="faq-question" 
              @click="toggleFaq(faq)"
            >
              <span>{{ t(faq.questionKey) }}</span>
              <span class="faq-icon">{{ faq.isOpen ? '−' : '+' }}</span>
            </button>
            <div class="faq-answer" v-show="faq.isOpen">
              <p>{{ t(faq.answerKey) }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from '../i18n'

const { t, setLocale, currentLocale } = useI18n()

const features = [
  { icon: '📊', type: 'success', titleKey: 'feature1-title', descKey: 'feature1-desc' },
  { icon: '🔇', type: 'primary', titleKey: 'feature2-title', descKey: 'feature2-desc' },
  { icon: '⚡', type: 'warning', titleKey: 'feature3-title', descKey: 'feature3-desc' },
  { icon: '📋', type: 'success', titleKey: 'feature4-title', descKey: 'feature4-desc' },
  { icon: '💾', type: 'primary', titleKey: 'feature5-title', descKey: 'feature5-desc' },
  { icon: '🔒', type: 'warning', titleKey: 'feature6-title', descKey: 'feature6-desc' }
]

const benefits = [
  { titleKey: 'benefit1-title', descKey: 'benefit1-desc' },
  { titleKey: 'benefit2-title', descKey: 'benefit2-desc' },
  { titleKey: 'benefit3-title', descKey: 'benefit3-desc' },
  { titleKey: 'benefit4-title', descKey: 'benefit4-desc' },
  { titleKey: 'benefit5-title', descKey: 'benefit5-desc' },
  { titleKey: 'benefit6-title', descKey: 'benefit6-desc' }
]

const faqs = ref([
  { questionKey: 'faq1-q', answerKey: 'faq1-a', isOpen: false },
  { questionKey: 'faq2-q', answerKey: 'faq2-a', isOpen: false },
  { questionKey: 'faq3-q', answerKey: 'faq3-a', isOpen: false },
  { questionKey: 'faq4-q', answerKey: 'faq4-a', isOpen: false },
  { questionKey: 'faq5-q', answerKey: 'faq5-a', isOpen: false },
  { questionKey: 'faq6-q', answerKey: 'faq6-a', isOpen: false }
])

const toggleFaq = (faq) => {
  faq.isOpen = !faq.isOpen
}
</script>

<style scoped>
/* Layout */
.landing-page {
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  position: relative;
  z-index: 1;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* Navigation */
.nav {
  position: sticky;
  top: 0;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  padding: 1rem 0;
  z-index: 100;
  backdrop-filter: blur(10px);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-logo h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.nav-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.btn-primary {
  padding: 0.5rem 1.5rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.btn-primary:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

[data-theme="light"] .btn-primary {
  color: black !important;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
}

[data-theme="light"] .btn-primary:hover {
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
}

/* Hero Section */
.hero {
  padding: 6rem 0;
  text-align: center;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, var(--primary), var(--success));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.5rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
  font-weight: 600;
}

.hero-description {
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;
  line-height: 1.7;
}

.btn-hero {
  display: inline-block;
  padding: 1rem 2.5rem;
  background: var(--primary);
  color: white;
  border-radius: 0.75rem;
  font-size: 1.1rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
}

.btn-hero:hover {
  background: var(--primary-dark);
  transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(99, 102, 241, 0.5);
}

[data-theme="light"] .btn-hero {
  color: black !important;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
}

[data-theme="light"] .btn-hero:hover {
  box-shadow: 0 10px 25px rgba(99, 102, 241, 0.45);
}

/* Features Section */
.features {
  padding: 4rem 0;
  background: var(--bg-secondary);
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 3rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 1rem;
  padding: 2rem;
  transition: all 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.feature-success {
  border-left: 4px solid var(--success);
}

.feature-primary {
  border-left: 4px solid var(--primary);
}

.feature-warning {
  border-left: 4px solid var(--warning);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.feature-card p {
  color: var(--text-secondary);
  line-height: 1.6;
}

/* Benefits Section */
.benefits {
  padding: 4rem 0;
}

.benefits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
}

.benefit-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 1rem;
  padding: 2rem;
  transition: all 0.3s;
}

.benefit-card:hover {
  border-color: var(--primary);
  transform: translateY(-3px);
}

.benefit-card h3 {
  font-size: 1.3rem;
  margin-bottom: 0.75rem;
  color: var(--primary);
  font-weight: 600;
}

.benefit-card p {
  color: var(--text-secondary);
  line-height: 1.6;
}

/* FAQ Section */
.faq {
  padding: 4rem 0;
  background: var(--bg-secondary);
}

.faq-list {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.faq-item {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  overflow: hidden;
  transition: all 0.3s;
}

.faq-item:hover {
  border-color: var(--primary);
}

.faq-question {
  width: 100%;
  padding: 1.5rem;
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 1.1rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;
}

.faq-question:hover {
  color: var(--primary);
}

.faq-icon {
  font-size: 1.5rem;
  font-weight: 300;
  transition: transform 0.3s;
}

.faq-open .faq-icon {
  transform: rotate(180deg);
}

.faq-answer {
  padding: 0 1.5rem 1.5rem;
  color: var(--text-secondary);
  line-height: 1.7;
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }

  .hero-subtitle {
    font-size: 1.2rem;
  }

  .features-grid,
  .benefits-grid {
    grid-template-columns: 1fr;
  }

  .nav-actions {
    flex-wrap: wrap;
  }
}
</style>
