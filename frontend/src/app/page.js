'use client';
import Link from 'next/link';
import { useAuth } from './components/AuthContext';
import { Card, Badge, SectionHeading, Stat, Button, Reveal, Stagger, StaggerItem } from './components/ui';
import {
  Droplet, Filter, HeartPulse, ArrowRight, BarChart3, Cpu, Database,
  Activity, ShieldCheck, Stethoscope, CheckCircle2,
} from 'lucide-react';

/* ── Pathologies ────────────────────────────────────────────── */
const diseases = [
  {
    key: 'diabetes', title: 'Diabète', icon: Droplet, href: '/predict/diabetes',
    model: 'Gradient Boosting', features: '8 variables',
    desc: 'Estimation de la prédisposition diabétique à partir de la glycémie, de l\'IMC et de l\'insuline.',
    accent: 'text-brand-bright', iconBg: 'bg-brand/10 border-brand/25', glow: 'glow-blue',
  },
  {
    key: 'ckd', title: 'Insuffisance rénale', icon: Filter, href: '/predict/ckd',
    model: 'Régression logistique', features: '24 variables',
    desc: 'Détection de l\'IRC par l\'analyse de l\'hémoglobine, de la créatinine et des marqueurs urinaires.',
    accent: 'text-emerald-300', iconBg: 'bg-emerald-500/10 border-emerald-500/25', glow: 'glow-green',
  },
  {
    key: 'framingham', title: 'Risque cardiovasculaire', icon: HeartPulse, href: '/predict/framingham',
    model: 'Régression logistique', features: '15 variables',
    desc: 'Score de Framingham à 10 ans basé sur le cholestérol, la pression systolique et le tabagisme.',
    accent: 'text-rose-300', iconBg: 'bg-rose-500/10 border-rose-500/25', glow: 'glow-red',
  },
];

/* ── Mini-visualisation SHAP (illustrative, pas de données réelles) ── */
const shapDemo = [
  { label: 'Glucose',  value: 78, dir: 'up' },
  { label: 'IMC',      value: 54, dir: 'up' },
  { label: 'Âge',      value: 32, dir: 'up' },
  { label: 'Insuline', value: 41, dir: 'down' },
];

/* ── Parcours ───────────────────────────────────────────────── */
const steps = [
  { icon: Stethoscope, title: 'Données cliniques', desc: 'Le praticien saisit les biomarqueurs physiologiques recueillis.' },
  { icon: Cpu,         title: 'Prédiction',        desc: 'Les modèles estiment la probabilité de risque en temps réel.' },
  { icon: BarChart3,   title: 'Explication SHAP',  desc: 'Chaque variable est décomposée selon son impact sur ce profil.' },
  { icon: Database,    title: 'Entrepôt BI',       desc: 'Les résultats alimentent le data warehouse décisionnel.' },
];

export default function Home() {
  const { user } = useAuth();

  const primaryHref = user ? (user.role === 'patient' ? '/patient' : '/predict/diabetes') : '/login';
  const primaryLabel = user
    ? `Accéder à mon espace${user.role === 'medecin' ? ' médecin' : user.role === 'admin' ? ' admin' : ''}`
    : 'Se connecter à la plateforme';

  return (
    <div className="space-y-28 pb-12">

      {/* ── 1. HERO ─────────────────────────────────────────── */}
      <section className="relative pt-10 md:pt-16">
        {/* trame de points discrète, fondue (feeling ingénierie) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.15]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(148,163,184,0.45) 1px, transparent 0)',
            backgroundSize: '30px 30px',
            maskImage: 'radial-gradient(ellipse 55% 50% at 50% 0%, #000 40%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 55% 50% at 50% 0%, #000 40%, transparent 100%)',
          }}
        />
        {/* halo d'accent unique, contenu et très discret */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 -top-20 -z-10 h-64 w-[42rem] max-w-[90vw] -translate-x-1/2 rounded-full"
          style={{ background: 'radial-gradient(closest-side, rgba(37,99,235,0.12), transparent)' }}
        />

        <Reveal className="mx-auto max-w-3xl text-center flex flex-col items-center gap-6">
          <Badge tone="brand" dot pulse>Solution clinique </Badge>

          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-ink text-balance leading-[1.05]">
            Le diagnostic précoce des{' '}
            <span className="text-brand-bright">maladies chroniques</span>,
            assisté et explicable.
          </h1>

          <p className="text-base md:text-lg text-muted leading-relaxed max-w-2xl">
            Une aide à la décision fondée sur des modèles de machine learning, l'explicabilité SHAP
            et le pilotage analytique — pour des choix cliniques étayés, jamais opaques.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button href={primaryHref} size="lg" iconRight={ArrowRight}>{primaryLabel}</Button>
            <Button href="#capabilities" size="lg" variant="secondary">Découvrir la solution</Button>
          </div>
        </Reveal>
      </section>

      {/* ── 2. PATHOLOGIES (cartes interactives) ────────────── */}
      <section className="space-y-10">
        <SectionHeading
          eyebrow="Pathologies prises en charge"
          title="Trois modèles cliniques, une même rigueur"
          subtitle="Sélectionnez une pathologie pour lancer l'analyse prédictive et générer le graphe d'explicabilité."
        />

        <Stagger className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {diseases.map((d) => {
            const Icon = d.icon;
            return (
              <StaggerItem key={d.key}>
                <Card href={d.href} glow={d.glow} className="group h-full p-6 flex flex-col">
                  <div className={`w-11 h-11 rounded-xl border grid place-items-center mb-5 ${d.iconBg}`}>
                    <Icon className={`w-5 h-5 ${d.accent}`} strokeWidth={2} aria-hidden="true" />
                  </div>
                  <h3 className="text-base font-semibold text-ink">{d.title}</h3>
                  <p className="mt-2 text-sm text-muted leading-relaxed flex-1">{d.desc}</p>

                  <div className="mt-5 flex items-center justify-between">
                    <Badge tone="neutral">{d.model}</Badge>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${d.accent} transition-transform duration-200 group-hover:translate-x-0.5`}>
                      Analyser
                      <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.25} aria-hidden="true" />
                    </span>
                  </div>
                </Card>
              </StaggerItem>
            );
          })}
        </Stagger>
      </section>

      {/* ── 3. CAPACITÉS (bento asymétrique) ────────────────── */}
      <section id="capabilities" className="space-y-10 scroll-mt-24">
        <SectionHeading
          eyebrow="La plateforme"
          title="Des outils scientifiques, pas une boîte noire"
          subtitle="Explicabilité, traçabilité et pilotage décisionnel réunis dans une interface unique."
        />

        <Stagger
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 auto-rows-[minmax(150px,auto)] gap-4"
          amount={0.1}
        >
          {/* Tuile ancre : explicabilité SHAP */}
          <StaggerItem className="sm:col-span-2 lg:col-span-2 lg:row-span-2">
            <Card className="h-full p-6 flex flex-col">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-lg bg-brand/10 border border-brand/25 grid place-items-center">
                  <BarChart3 className="w-5 h-5 text-brand-bright" strokeWidth={2} aria-hidden="true" />
                </span>
                <h3 className="text-sm font-semibold text-ink">Explicabilité SHAP</h3>
              </div>
              <p className="mt-3 text-sm text-muted leading-relaxed">
                Pour chaque prédiction, la contribution de chaque variable est quantifiée — le clinicien
                garde le contrôle et comprend le « pourquoi ».
              </p>

              {/* mini-graphe illustratif */}
              <div className="mt-5 space-y-2.5">
                {shapDemo.map((f) => (
                  <div key={f.label} className="flex items-center gap-3">
                    <span className="w-16 shrink-0 text-[11px] text-faint text-right">{f.label}</span>
                    <div className="flex-1 h-2 rounded-full bg-panel-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${f.dir === 'up' ? 'bg-rose-500/70' : 'bg-brand/70'}`}
                        style={{ width: `${f.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-4 text-[10px] font-medium uppercase tracking-wider text-faint">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-rose-500/70" />Augmente</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-brand/70" />Réduit</span>
                <span className="ml-auto normal-case tracking-normal italic text-faint/70">illustration</span>
              </div>
            </Card>
          </StaggerItem>

          {/* Modèles entraînés */}
          <StaggerItem className="lg:col-span-2">
            <Card className="h-full p-6">
              <span className="w-9 h-9 rounded-lg bg-panel-2 border border-line grid place-items-center mb-4">
                <Cpu className="w-5 h-5 text-muted" strokeWidth={2} aria-hidden="true" />
              </span>
              <h3 className="text-sm font-semibold text-ink">Modèles entraînés</h3>
              <p className="mt-2 text-[13px] text-muted leading-relaxed">
                Algorithmes optimisés sur des jeux de données cliniques de référence.
              </p>
            </Card>
          </StaggerItem>

          {/* Data warehouse / BI */}
          <StaggerItem className="lg:col-span-2">
            <Card className="h-full p-6">
              <span className="w-9 h-9 rounded-lg bg-panel-2 border border-line grid place-items-center mb-4">
                <Database className="w-5 h-5 text-muted" strokeWidth={2} aria-hidden="true" />
              </span>
              <h3 className="text-sm font-semibold text-ink">Data warehouse &amp; BI</h3>
              <p className="mt-2 text-[13px] text-muted leading-relaxed">
                Schéma en étoile PostgreSQL pour le suivi d'indicateurs épidémiologiques.
              </p>
            </Card>
          </StaggerItem>

          {/* Suivi patient */}
          <StaggerItem className="lg:col-span-2">
            <Card className="h-full p-6">
              <span className="w-9 h-9 rounded-lg bg-panel-2 border border-line grid place-items-center mb-4">
                <Activity className="w-5 h-5 text-muted" strokeWidth={2} aria-hidden="true" />
              </span>
              <h3 className="text-sm font-semibold text-ink">Suivi patient</h3>
              <p className="mt-2 text-[13px] text-muted leading-relaxed">
                Portail dédié au relevé quotidien des mesures (glycémie, tension).
              </p>
            </Card>
          </StaggerItem>

          {/* Sécurité */}
          <StaggerItem className="lg:col-span-2">
            <Card className="h-full p-6">
              <span className="w-9 h-9 rounded-lg bg-panel-2 border border-line grid place-items-center mb-4">
                <ShieldCheck className="w-5 h-5 text-muted" strokeWidth={2} aria-hidden="true" />
              </span>
              <h3 className="text-sm font-semibold text-ink">Sessions sécurisées</h3>
              <p className="mt-2 text-[13px] text-muted leading-relaxed">
                Authentification par jeton et cloisonnement des accès par rôle.
              </p>
            </Card>
          </StaggerItem>
        </Stagger>
      </section>

      {/* ── 4. PARCOURS ─────────────────────────────────────── */}
      <section className="space-y-12">
        <SectionHeading eyebrow="Le parcours de la donnée" title="Comment fonctionne le diagnostic" />

        <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          <div aria-hidden="true" className="hidden lg:block absolute top-6 left-[12%] right-[12%] h-px bg-line" />
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <StaggerItem key={i} className="relative z-10 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-12 h-12 rounded-xl bg-panel border border-line grid place-items-center">
                    <Icon className="w-5 h-5 text-brand-bright" strokeWidth={2} aria-hidden="true" />
                  </span>
                  <span className="tabular text-xs font-semibold text-faint">0{i + 1}</span>
                </div>
                <h3 className="text-sm font-semibold text-ink">{s.title}</h3>
                <p className="text-[13px] text-muted leading-relaxed">{s.desc}</p>
              </StaggerItem>
            );
          })}
        </Stagger>
      </section>

      {/* ── 5. ARCHITECTURE / SPECS ─────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <Reveal className="lg:col-span-6 flex flex-col gap-6">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-bright">
            Architecture clinique
          </span>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-ink text-balance">
            Une interface décisionnelle au service de meilleures décisions
          </h2>
          <p className="text-sm text-muted leading-relaxed">
            La plateforme allie la puissance prédictive de l'apprentissage automatique à la rigueur de
            la business intelligence. Chaque analyse est accompagnée de ses explications SHAP : le médecin
            comprend précisément les motifs de la prédiction.
          </p>
          <ul className="flex flex-col gap-3">
            {[
              'Chiffrement des sessions et cloisonnement des données cliniques.',
              'Génération d\'alertes physiologiques pour les cas critiques.',
              'Rapports d\'activité et analyse populationnelle décisionnelle.',
            ].map((t, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[13px] text-muted">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" strokeWidth={2.25} aria-hidden="true" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.1} className="lg:col-span-6">
          <Card className="p-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-faint mb-4">
              Spécifications techniques
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Modèles IA" value="3" hint="GBM · LR · LR" icon={Cpu} />
              <Stat label="Variables analysées" value="47" hint="8 + 24 + 15" icon={BarChart3} accent="text-brand-bright" />
              <Stat label="Explicabilité" value="SHAP" hint="locale & globale" icon={Stethoscope} />
              <Stat label="Entrepôt BI" value="DWH" hint="PostgreSQL · étoile" icon={Database} />
            </div>
          </Card>
        </Reveal>
      </section>

      {/* ── 6. CTA FINAL ────────────────────────────────────── */}
      <Reveal>
        <Card className="p-8 md:p-12 text-center flex flex-col items-center gap-5">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-ink text-balance max-w-xl">
            Prêt à transformer vos données cliniques en décisions
          </h2>
          <p className="text-sm text-muted max-w-md">
            Connectez-vous pour lancer une première analyse prédictive et explorer le tableau de bord décisionnel.
          </p>
          <Button href={primaryHref} size="lg" iconRight={ArrowRight}>{primaryLabel}</Button>
        </Card>
      </Reveal>

    </div>
  );
}
