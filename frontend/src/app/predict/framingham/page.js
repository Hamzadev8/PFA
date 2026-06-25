'use client';
import PredictionForm from '../../components/PredictionForm';
import { predictFramingham } from '../../lib/api';
import { HeartPulse, User, FlaskConical } from 'lucide-react';

const fields = [
  { name: 'male',            label: 'Sexe (1=homme, 0=femme)',   example: 1,   step: 1,   unit: '',      group: 'Profil' },
  { name: 'age',             label: 'Âge',                       example: 55,  step: 1,   unit: 'ans',   group: 'Profil' },
  { name: 'education',       label: 'Niveau éducation (1-4)',    example: 2,   step: 1,   unit: '',      group: 'Profil' },
  { name: 'currentSmoker',   label: 'Fumeur actuel (0/1)',       example: 0,   step: 1,   unit: '',      group: 'Profil' },
  { name: 'cigsPerDay',      label: 'Cigarettes par jour',       example: 0,   step: 1,   unit: 'cig/j', group: 'Profil' },
  { name: 'BPMeds',          label: 'Médicaments tension (0/1)', example: 0,   step: 1,   unit: '',      group: 'Cardiovasculaire' },
  { name: 'prevalentStroke', label: 'Antécédent d\'AVC (0/1)',   example: 0,   step: 1,   unit: '',      group: 'Cardiovasculaire' },
  { name: 'prevalentHyp',    label: 'Hypertension (0/1)',        example: 1,   step: 1,   unit: '',      group: 'Cardiovasculaire' },
  { name: 'diabetes',        label: 'Diabète (0/1)',             example: 0,   step: 1,   unit: '',      group: 'Cardiovasculaire' },
  { name: 'sysBP',           label: 'Pression systolique',       example: 140, step: 1,   unit: 'mmHg',  group: 'Cardiovasculaire' },
  { name: 'diaBP',           label: 'Pression diastolique',      example: 90,  step: 1,   unit: 'mmHg',  group: 'Cardiovasculaire' },
  { name: 'totChol',         label: 'Cholestérol total',         example: 230, step: 1,   unit: 'mg/dL', group: 'Métabolique' },
  { name: 'BMI',             label: 'IMC',                       example: 27,  step: 0.1, unit: 'kg/m²', group: 'Métabolique' },
  { name: 'heartRate',       label: 'Fréquence cardiaque',       example: 75,  step: 1,   unit: 'bpm',   group: 'Métabolique' },
  { name: 'glucose',         label: 'Glycémie',                  example: 85,  step: 1,   unit: 'mg/dL', group: 'Métabolique' },
];

const categories = ['Profil', 'Cardiovasculaire', 'Métabolique'];
const categoryIcons = { 'Profil': User, 'Cardiovasculaire': HeartPulse, 'Métabolique': FlaskConical };

export default function FraminghamPage() {
  return (
    <PredictionForm
      diseaseCode="framingham"
      title="Analyse prédictive — Risque cardiovasculaire"
      subtitle="Évaluez le risque d'accident cardiovasculaire à 10 ans via le modèle de Framingham."
      icon={HeartPulse}
      accent="rose"
      fields={fields}
      categories={categories}
      categoryIcons={categoryIcons}
      predictFn={predictFramingham}
    />
  );
}
