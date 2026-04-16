import { X } from 'lucide-react';
import type { ChangeEvent, FormEvent } from 'react';

import { GRADES } from '../lib/student-utils';
import type { Student, StudentFormErrors } from '../types';

interface StudentFormModalProps {
  isOpen: boolean;
  isEditing: boolean;
  isSaving: boolean;
  formData: Student;
  formErrors: StudentFormErrors;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFieldChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
}

const TEXT = {
  editTitle: '\u7f16\u8f91\u5b66\u751f\u4fe1\u606f',
  createTitle: '\u65b0\u589e\u5b66\u751f\u4fe1\u606f',
  description:
    '\u6240\u6709\u5b57\u6bb5\u4f1a\u63d0\u4ea4\u5230 FastAPI \u540e\u7aef\u5e76\u4fdd\u5b58\u5230 SQLite \u6570\u636e\u5e93\u4e2d\u3002',
  close: '\u5173\u95ed',
  id: '\u5b66\u53f7',
  idPlaceholder: '\u4f8b\u5982 20230101',
  name: '\u59d3\u540d',
  namePlaceholder: '\u8bf7\u8f93\u5165\u5b66\u751f\u59d3\u540d',
  gender: '\u6027\u522b',
  male: '\u7537',
  female: '\u5973',
  grade: '\u5e74\u7ea7',
  age: '\u5e74\u9f84',
  phone: '\u8054\u7cfb\u7535\u8bdd',
  phonePlaceholder: '\u8bf7\u8f93\u5165 11 \u4f4d\u624b\u673a\u53f7',
  enrollmentDate: '\u5165\u6821\u65e5\u671f',
  address: '\u5bb6\u5ead\u4f4f\u5740',
  addressPlaceholder: '\u8bf7\u8f93\u5165\u8be6\u7ec6\u5730\u5740',
  cancel: '\u53d6\u6d88',
  saving: '\u4fdd\u5b58\u4e2d...',
  save: '\u4fdd\u5b58',
};

export function StudentFormModal({
  isOpen,
  isEditing,
  isSaving,
  formData,
  formErrors,
  onClose,
  onSubmit,
  onFieldChange,
}: StudentFormModalProps) {
  if (!isOpen) {
    return null;
  }

  const fieldClassName = (hasError?: string) =>
    `w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition ${
      hasError
        ? 'border-rose-400 focus:ring-4 focus:ring-rose-100'
        : 'border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              {isEditing ? TEXT.editTitle : TEXT.createTitle}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{TEXT.description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label={TEXT.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="overflow-y-auto p-6" onSubmit={onSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">{TEXT.id}</span>
              <input
                type="text"
                name="id"
                value={formData.id}
                onChange={onFieldChange}
                disabled={isEditing}
                className={`${fieldClassName(formErrors.id)} disabled:bg-slate-100 disabled:text-slate-500`}
                placeholder={TEXT.idPlaceholder}
              />
              {formErrors.id ? <p className="mt-1 text-xs text-rose-600">{formErrors.id}</p> : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">{TEXT.name}</span>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={onFieldChange}
                className={fieldClassName(formErrors.name)}
                placeholder={TEXT.namePlaceholder}
              />
              {formErrors.name ? <p className="mt-1 text-xs text-rose-600">{formErrors.name}</p> : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">{TEXT.gender}</span>
              <select name="gender" value={formData.gender} onChange={onFieldChange} className={fieldClassName()}>
                <option value={TEXT.male}>{TEXT.male}</option>
                <option value={TEXT.female}>{TEXT.female}</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">{TEXT.grade}</span>
              <select name="grade" value={formData.grade} onChange={onFieldChange} className={fieldClassName()}>
                {GRADES.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">{TEXT.age}</span>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={onFieldChange}
                min={1}
                max={100}
                className={fieldClassName(formErrors.age)}
              />
              {formErrors.age ? <p className="mt-1 text-xs text-rose-600">{formErrors.age}</p> : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">{TEXT.phone}</span>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={onFieldChange}
                className={fieldClassName(formErrors.phone)}
                placeholder={TEXT.phonePlaceholder}
              />
              {formErrors.phone ? <p className="mt-1 text-xs text-rose-600">{formErrors.phone}</p> : null}
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-700">{TEXT.enrollmentDate}</span>
              <input
                type="date"
                name="enrollmentDate"
                value={formData.enrollmentDate}
                onChange={onFieldChange}
                className={fieldClassName(formErrors.enrollmentDate)}
              />
              {formErrors.enrollmentDate ? (
                <p className="mt-1 text-xs text-rose-600">{formErrors.enrollmentDate}</p>
              ) : null}
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-700">{TEXT.address}</span>
              <textarea
                name="address"
                rows={4}
                value={formData.address}
                onChange={onFieldChange}
                className={fieldClassName(formErrors.address)}
                placeholder={TEXT.addressPlaceholder}
              />
              {formErrors.address ? (
                <p className="mt-1 text-xs text-rose-600">{formErrors.address}</p>
              ) : null}
            </label>
          </div>

          <div className="mt-8 flex justify-end gap-3 border-t border-slate-200 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
            >
              {TEXT.cancel}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {isSaving ? TEXT.saving : TEXT.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
