// בחלונית העריכה (Form) - החזרת השדות:
<div className="p-5 bg-red-50 rounded-2xl border border-red-100 space-y-4">
  <div className="space-y-2">
    <label className="flex items-center gap-2 text-sm font-bold text-red-800">
      <AlertCircle className="w-4 h-4" /> הגבלות אימון:
    </label>
    <select 
      className="w-full p-3 bg-white border border-red-200 rounded-xl font-bold focus:ring-2 focus:ring-red-500 outline-none"
      value={formData.trainingLimitation}
      onChange={e => setFormData({...formData, trainingLimitation: e.target.value as TrainingLimitation})}
    >
      <option value={TrainingLimitation.NONE}>אין הגבלות - מאושר מלא</option>
      <option value={TrainingLimitation.PARTIAL}>מגבלה חלקית (הערה למאמן)</option>
      <option value={TrainingLimitation.FULL}>מניעה מלאה (אסור להתאמן!)</option>
    </select>
  </div>

  <div className="space-y-2">
    <label className="text-sm font-bold text-red-800 mr-1">פירוט המגבלה (יוצג למאמן בכניסה):</label>
    <textarea 
      className="w-full p-3 bg-white border border-red-200 rounded-xl h-24 text-sm outline-none focus:ring-2 focus:ring-red-500"
      placeholder="לדוגמה: בישיבה בלבד, בהשגחת פיזיותרפיסט..."
      value={formData.medicalConditions || ''}
      onChange={e => setFormData({...formData, medicalConditions: e.target.value})}
    />
  </div>
</div>