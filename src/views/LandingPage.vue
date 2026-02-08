<template>
  <div class="landing-page">
    <!-- Navigation -->
    <nav class="nav">
      <div class="nav-container">
        <div class="nav-logo">
          <h2>🎵 Audio Normalizer</h2>
        </div>
        <div class="nav-controls">
          <HeaderControls />
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
import { useI18n } from '../composables/useI18n'
import HeaderControls from '../components/HeaderControls.vue'

const { t, locale, toggleLocale } = useI18n()

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
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 0.875rem;
  letter-spacing: -0.01em;
}

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

/* Navigation */
.nav {
  position: sticky;
  top: 0;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  padding: 0.75rem 0;
  z-index: 10;
  backdrop-filter: blur(12px);
}

.nav-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-logo h2 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  letter-spacing: -0.02em;
}


/* Hero Section */
.hero {
  padding: 4rem 0 3rem;
  text-align: center;
}

.hero-content {
  max-width: 680px;
  margin: 0 auto;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  background: linear-gradient(135deg, var(--primary), var(--primary-secondary, #014f99));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.03em;
  line-height: 1.15;
}

.hero-subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
  font-weight: 500;
  letter-spacing: -0.01em;
}

.hero-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
  line-height: 1.6;
  opacity: 0.85;
}

.btn-hero {
  display: inline-block;
  padding: 0.65rem 1.75rem;
  background: var(--primary);
  color: var(--bg-primary);
  border-radius: 0.5rem;
  font-size: 0.8rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.25s;
  text-transform: none;
  letter-spacing: 0.02em;
  box-shadow: 0 2px 10px rgba(201, 152, 77, 0.25);
}

.btn-hero:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(201, 152, 77, 0.35);
}

/* Features Section */
.features {
  padding: 2.5rem 0;
  background: var(--bg-secondary);
}

.section-title {
  text-align: center;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 2rem;
  letter-spacing: -0.02em;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.25rem;
}

.feature-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  padding: 1.25rem;
  transition: all 0.25s;
}

.feature-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.feature-success {
  border-left: 3px solid var(--success);
}

.feature-primary {
  border-left: 3px solid var(--primary);
}

.feature-warning {
  border-left: 3px solid var(--primary-secondary, #014f99);
}

.feature-icon {
  font-size: 1.75rem;
  margin-bottom: 0.75rem;
}

.feature-card h3 {
  font-size: 0.95rem;
  margin-bottom: 0.35rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.feature-card p {
  color: var(--text-secondary);
  line-height: 1.5;
  font-size: 0.8rem;
}

/* Benefits Section */
.benefits {
  padding: 2.5rem 0;
}

.benefits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.25rem;
}

.benefit-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  padding: 1.25rem;
  transition: all 0.25s;
}

.benefit-card:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
}

.benefit-card h3 {
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
  color: var(--primary);
  font-weight: 600;
  letter-spacing: -0.01em;
}

.benefit-card p {
  color: var(--text-secondary);
  line-height: 1.5;
  font-size: 0.8rem;
}

/* FAQ Section */
.faq {
  padding: 2.5rem 0;
  background: var(--bg-secondary);
}

.faq-list {
  max-width: 700px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.faq-item {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  overflow: hidden;
  transition: all 0.25s;
}

.faq-item:hover {
  border-color: var(--primary);
}

.faq-question {
  width: 100%;
  padding: 1rem 1.25rem;
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 0.875rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;
  letter-spacing: -0.01em;
}

.faq-question:hover {
  color: var(--primary);
}

.faq-icon {
  font-size: 1.1rem;
  font-weight: 400;
  transition: transform 0.25s;
  opacity: 0.7;
}

.faq-open .faq-icon {
  transform: rotate(180deg);
}

.faq-answer {
  padding: 0 1.25rem 1rem;
  color: var(--text-secondary);
  line-height: 1.6;
  font-size: 0.8rem;
  animation: fadeIn 0.25s;
}

.faq-answer p {
  margin: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .hero-title {
    font-size: 1.75rem;
  }

  .hero-subtitle {
    font-size: 0.9rem;
  }

  .hero-description {
    font-size: 0.8rem;
  }

  .section-title {
    font-size: 1.25rem;
  }

  .features-grid,
  .benefits-grid {
    grid-template-columns: 1fr;
  }

  .container {
    padding: 0 1rem;
  }
}
</style>
