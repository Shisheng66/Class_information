import { X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

import type { Student } from '../types';

interface QrCodeModalProps {
  student: Student | null;
  onClose: () => void;
}

const TEXT = {
  name: '\u59d3\u540d',
  id: '\u5b66\u53f7',
  gender: '\u6027\u522b',
  grade: '\u5e74\u7ea7',
  age: '\u5e74\u9f84',
  phone: '\u7535\u8bdd',
  enrollmentDate: '\u5165\u6821\u65e5\u671f',
  address: '\u5730\u5740',
  title: '\u5b66\u751f\u540d\u7247\u4e8c\u7ef4\u7801',
  description: '\u626b\u7801\u5373\u53ef\u67e5\u770b\u5f53\u524d\u5b66\u751f\u7684\u57fa\u7840\u4fe1\u606f\u3002',
  close: '\u5173\u95ed',
};

export function QrCodeModal({ student, onClose }: QrCodeModalProps) {
  if (!student) {
    return null;
  }

  const qrContent = [
    `${TEXT.name}：${student.name}`,
    `${TEXT.id}：${student.id}`,
    `${TEXT.gender}：${student.gender}`,
    `${TEXT.grade}：${student.grade}`,
    `${TEXT.age}：${student.age}`,
    `${TEXT.phone}：${student.phone}`,
    `${TEXT.enrollmentDate}：${student.enrollmentDate}`,
    `${TEXT.address}：${student.address}`,
  ].join('\n');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{TEXT.title}</h2>
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

        <div className="space-y-5 px-6 py-8 text-center">
          <div className="mx-auto inline-flex rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <QRCodeSVG value={qrContent} size={200} includeMargin />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">{student.name}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {student.id} · {student.grade}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
