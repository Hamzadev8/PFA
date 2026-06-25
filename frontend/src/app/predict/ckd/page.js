'use client';
import PredictionForm from '../../components/PredictionForm';
import { predictCKD } from '../../lib/api';
import { Filter, Stethoscope, FlaskConical, Droplet, ClipboardList } from 'lucide-react';

const fields = [
  { name: 'age',   label: 'Âge',                       example: 50,   step: 1,     unit: 'ans',    group: 'Général' },
  { name: 'bp',    label: 'Pression artérielle',        example: 80,   step: 1,     unit: 'mm Hg',  group: 'Général' },
  { name: 'sg',    label: 'Densité urinaire',           example: 1.02, step: 0.001, unit: '',       group: 'Urine' },
  { name: 'al',    label: 'Albumine urinaire (0-5)',    example: 1,    step: 1,     unit: '',       group: 'Urine' },
  { name: 'su',    label: 'Sucre urinaire (0-5)',       example: 0,    step: 1,     unit: '',       group: 'Urine' },
  { name: 'rbc',   label: 'Globules Rouges (0=n,1=abn)', example: 0,   step: 1,     unit: '',       group: 'Urine' },
  { name: 'pc',    label: 'Cellules de pus (0=n,1=abn)', example: 0,   step: 1,     unit: '',       group: 'Urine' },
  { name: 'pcc',   label: 'Caillots de pus (0/1)',      example: 0,    step: 1,     unit: '',       group: 'Urine' },
  { name: 'ba',    label: 'Bactéries (0/1)',            example: 0,    step: 1,     unit: '',       group: 'Urine' },
  { name: 'bgr',   label: 'Glycémie aléatoire',         example: 100,  step: 1,     unit: 'mg/dL',  group: 'Sang' },
  { name: 'bu',    label: 'Urée sanguine',              example: 30,   step: 1,     unit: 'mg/dL',  group: 'Sang' },
  { name: 'sc',    label: 'Créatinine sérique',         example: 1.0,  step: 0.1,   unit: 'mg/dL',  group: 'Sang' },
  { name: 'sod',   label: 'Sodium sérique',             example: 140,  step: 1,     unit: 'mEq/L',  group: 'Sang' },
  { name: 'pot',   label: 'Potassium sérique',          example: 4.5,  step: 0.1,   unit: 'mEq/L',  group: 'Sang' },
  { name: 'hemo',  label: 'Hémoglobine',                example: 13,   step: 0.1,   unit: 'g/dL',   group: 'Sang' },
  { name: 'pcv',   label: 'Hématocrite (%)',            example: 40,   step: 1,     unit: '%',      group: 'Sang' },
  { name: 'wc',    label: 'Globules blancs',            example: 8000, step: 100,   unit: '/cumm',  group: 'Sang' },
  { name: 'rc',    label: 'Globules rouges',            example: 4.5,  step: 0.1,   unit: 'M/cumm', group: 'Sang' },
  { name: 'htn',   label: 'Hypertension (0/1)',         example: 0,    step: 1,     unit: '',       group: 'Symptômes' },
  { name: 'dm',    label: 'Diabète (0/1)',              example: 0,    step: 1,     unit: '',       group: 'Symptômes' },
  { name: 'cad',   label: 'Coronarienne (0/1)',         example: 0,    step: 1,     unit: '',       group: 'Symptômes' },
  { name: 'appet', label: 'Bon appétit (1=oui,0=non)',  example: 1,    step: 1,     unit: '',       group: 'Symptômes' },
  { name: 'pe',    label: 'Œdème périphérique (0/1)',   example: 0,    step: 1,     unit: '',       group: 'Symptômes' },
  { name: 'ane',   label: 'Anémie (0/1)',               example: 0,    step: 1,     unit: '',       group: 'Symptômes' },
];

const categories = ['Général', 'Urine', 'Sang', 'Symptômes'];
const categoryIcons = { 'Général': Stethoscope, 'Urine': FlaskConical, 'Sang': Droplet, 'Symptômes': ClipboardList };

export default function CKDPage() {
  return (
    <PredictionForm
      diseaseCode="ckd"
      title="Analyse prédictive — Insuffisance rénale (IRC)"
      subtitle="Saisissez les paramètres biologiques et cliniques pour dépister l'insuffisance rénale chronique."
      icon={Filter}
      accent="emerald"
      fields={fields}
      categories={categories}
      categoryIcons={categoryIcons}
      predictFn={predictCKD}
    />
  );
}
