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
          <router-link to="/app" class="btn-hero"> {{ t('hero-cta') }} → </router-link>
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
          <div v-for="benefit in benefits" :key="benefit.titleKey" class="benefit-card">
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
            <button class="faq-question" @click="toggleFaq(faq)">
              <span>{{ t(faq.questionKey) }}</span>
              <span class="faq-icon">{{ faq.isOpen ? '−' : '+' }}</span>
            </button>
            <div v-show="faq.isOpen" class="faq-answer">
              <p>{{ t(faq.answerKey) }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { useI18n } from '../composables/useI18n'
  import HeaderControls from '../components/HeaderControls.vue'

  const { t } = useI18n()

  const features = [
    { icon: '📊', type: 'success', titleKey: 'feature1-title', descKey: 'feature1-desc' },
    { icon: '🔇', type: 'primary', titleKey: 'feature2-title', descKey: 'feature2-desc' },
    { icon: '⚡', type: 'warning', titleKey: 'feature3-title', descKey: 'feature3-desc' },
    { icon: '📋', type: 'success', titleKey: 'feature4-title', descKey: 'feature4-desc' },
    { icon: '💾', type: 'primary', titleKey: 'feature5-title', descKey: 'feature5-desc' },
    { icon: '🔒', type: 'warning', titleKey: 'feature6-title', descKey: 'feature6-desc' },
  ]

  const benefits = [
    { titleKey: 'benefit1-title', descKey: 'benefit1-desc' },
    { titleKey: 'benefit2-title', descKey: 'benefit2-desc' },
    { titleKey: 'benefit3-title', descKey: 'benefit3-desc' },
    { titleKey: 'benefit4-title', descKey: 'benefit4-desc' },
    { titleKey: 'benefit5-title', descKey: 'benefit5-desc' },
    { titleKey: 'benefit6-title', descKey: 'benefit6-desc' },
  ]

  const faqs = ref([
    { questionKey: 'faq1-q', answerKey: 'faq1-a', isOpen: false },
    { questionKey: 'faq2-q', answerKey: 'faq2-a', isOpen: false },
    { questionKey: 'faq3-q', answerKey: 'faq3-a', isOpen: false },
    { questionKey: 'faq4-q', answerKey: 'faq4-a', isOpen: false },
    { questionKey: 'faq5-q', answerKey: 'faq5-a', isOpen: false },
    { questionKey: 'faq6-q', answerKey: 'faq6-a', isOpen: false },
  ])

  const toggleFaq = (faq: { isOpen: boolean }) => {
    faq.isOpen = !faq.isOpen
  }
</script>

<style scoped>
  /* Layout */
  .landing-page {
    min-height: 100vh;
    background: var(--ds-surface-0);
    color: var(--ds-text);
    position: relative;
    z-index: 1;
    font-size: var(--ds-text-md);
    line-height: var(--ds-leading);
  }

  .container {
    max-width: var(--ds-container);
    margin: 0 auto;
    padding: 0 var(--ds-gutter);
  }

  /* Navigation */
  .nav {
    position: sticky;
    top: 0;
    background: var(--ds-surface-1);
    border-bottom: var(--ds-border-width) solid var(--ds-border);
    z-index: var(--ds-z-topbar);
  }

  .nav-container {
    max-width: var(--ds-container);
    min-height: var(--ds-topbar-height);
    margin: 0 auto;
    padding: 0 var(--ds-gutter);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .nav-controls {
    display: flex;
    align-items: center;
    gap: var(--ds-space-2);
  }

  .nav-logo h2 {
    font-size: var(--ds-text-lg);
    font-weight: var(--ds-weight-semibold);
    line-height: var(--ds-leading-tight);
    margin: 0;
    letter-spacing: var(--ds-tracking-tight);
  }

  /* Hero Section */
  .hero {
    padding: var(--ds-space-16) 0 var(--ds-space-12);
    text-align: center;
  }

  .hero-content {
    max-width: 680px;
    margin: 0 auto;
  }

  .hero-title {
    font-size: var(--ds-text-3xl);
    font-weight: var(--ds-weight-bold);
    line-height: var(--ds-leading-tight);
    letter-spacing: var(--ds-tracking-tight);
    color: var(--ds-text);
    margin-bottom: var(--ds-space-3);
  }

  .hero-subtitle {
    font-size: var(--ds-text-lg);
    font-weight: var(--ds-weight-medium);
    color: var(--ds-text);
    margin-bottom: var(--ds-space-3);
  }

  .hero-description {
    font-size: var(--ds-text-md);
    color: var(--ds-text-2);
    margin-bottom: var(--ds-space-6);
  }

  .btn-hero {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: var(--ds-control-lg);
    padding: 0 var(--ds-space-5);
    background: var(--ds-accent);
    color: var(--ds-on-accent);
    border-radius: var(--ds-radius-md);
    font-size: var(--ds-text-lg);
    font-weight: var(--ds-weight-semibold);
    text-decoration: none;
    transition: background-color var(--ds-duration) var(--ds-ease);
  }

  .btn-hero:hover {
    background: var(--ds-accent-hover);
    color: var(--ds-on-accent);
  }

  .btn-hero:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }

  /* Sections alternate between page and panel surface. */
  .features,
  .faq {
    padding: var(--ds-space-12) 0;
    background: var(--ds-surface-1);
    border-top: var(--ds-border-width) solid var(--ds-border);
    border-bottom: var(--ds-border-width) solid var(--ds-border);
  }

  .benefits {
    padding: var(--ds-space-12) 0;
  }

  .section-title {
    text-align: center;
    font-size: var(--ds-text-2xl);
    font-weight: var(--ds-weight-bold);
    line-height: var(--ds-leading-tight);
    letter-spacing: var(--ds-tracking-tight);
    margin-bottom: var(--ds-space-8);
  }

  /* Cards: on a panel section they sit on the page surface, and vice versa. */
  .features-grid,
  .benefits-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--ds-gap);
  }

  .feature-card,
  .benefit-card {
    border: var(--ds-border-width) solid var(--ds-border);
    border-radius: var(--ds-radius-lg);
    padding: var(--ds-space-5);
    transition: border-color var(--ds-duration) var(--ds-ease);
  }

  .feature-card {
    background: var(--ds-surface-0);
  }

  .benefit-card {
    background: var(--ds-surface-1);
  }

  .feature-card:hover,
  .benefit-card:hover {
    border-color: var(--ds-border-strong);
  }

  .feature-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--ds-control-lg);
    height: var(--ds-control-lg);
    border-radius: var(--ds-radius-md);
    background: var(--ds-surface-2);
    font-size: var(--ds-text-xl);
    margin-bottom: var(--ds-space-3);
  }

  .feature-card h3,
  .benefit-card h3 {
    font-size: var(--ds-text-lg);
    font-weight: var(--ds-weight-semibold);
    line-height: var(--ds-leading-tight);
    margin-bottom: var(--ds-space-2);
    color: var(--ds-text);
  }

  .feature-card p,
  .benefit-card p {
    color: var(--ds-text-2);
    font-size: var(--ds-text-md);
    margin: 0;
  }

  /* FAQ Section */
  .faq-list {
    max-width: 720px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: var(--ds-space-3);
  }

  .faq-item {
    background: var(--ds-surface-0);
    border: var(--ds-border-width) solid var(--ds-border);
    border-radius: var(--ds-radius-md);
    overflow: hidden;
    transition: border-color var(--ds-duration) var(--ds-ease);
  }

  .faq-item:hover,
  .faq-open {
    border-color: var(--ds-border-strong);
  }

  .faq-question {
    width: 100%;
    min-height: var(--ds-row-height);
    padding: var(--ds-space-3) var(--ds-space-5);
    background: none;
    border: none;
    color: var(--ds-text);
    font: inherit;
    font-size: var(--ds-text-lg);
    font-weight: var(--ds-weight-medium);
    text-align: left;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--ds-space-4);
    transition: background-color var(--ds-duration) var(--ds-ease);
  }

  .faq-question:hover {
    background: var(--ds-surface-2);
  }

  .faq-question:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px var(--ds-accent);
  }

  .faq-icon {
    font-size: var(--ds-text-xl);
    color: var(--ds-text-2);
    flex-shrink: 0;
  }

  .faq-answer {
    padding: 0 var(--ds-space-5) var(--ds-space-4);
    color: var(--ds-text-2);
    font-size: var(--ds-text-md);
  }

  .faq-answer p {
    margin: 0;
  }

  /* Responsive - Tablet */
  @media (max-width: 768px) {
    .container,
    .nav-container {
      padding: 0 var(--ds-space-4);
    }

    .hero {
      padding: var(--ds-space-10) 0 var(--ds-space-8);
    }

    .hero-title {
      font-size: var(--ds-text-2xl);
    }

    .section-title {
      font-size: var(--ds-text-xl);
      margin-bottom: var(--ds-space-6);
    }

    .features-grid,
    .benefits-grid {
      grid-template-columns: 1fr;
    }

    .features,
    .benefits,
    .faq {
      padding: var(--ds-space-8) 0;
    }

    .faq-question {
      padding: var(--ds-space-3) var(--ds-space-4);
      font-size: var(--ds-text-md);
    }

    .faq-answer {
      padding: 0 var(--ds-space-4) var(--ds-space-3);
    }
  }

  /* Responsive - Phone */
  @media (max-width: 480px) {
    .container,
    .nav-container {
      padding: 0 var(--ds-space-3);
    }

    .nav-logo h2 {
      font-size: var(--ds-text-md);
    }

    .hero {
      padding: var(--ds-space-8) 0 var(--ds-space-6);
    }

    .hero-subtitle {
      font-size: var(--ds-text-md);
    }

    .btn-hero {
      width: 100%;
      max-width: 320px;
      height: var(--ds-row-height);
    }

    .feature-card,
    .benefit-card {
      padding: var(--ds-space-4);
    }
  }
</style>
