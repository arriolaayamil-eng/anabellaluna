const mongoose = require('mongoose');

const TaskActivitySchema = new mongoose.Schema(
  {
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tarea', required: true, index: true },
    userId: { type: String, default: '' },
    userName: { type: String, default: '' },
    action: {
      type: String,
      enum: [
        'created', 'updated', 'status_changed', 'priority_changed',
        'assigned', 'delegated', 'comment', 'checklist_added',
        'checklist_toggled', 'label_changed', 'due_date_changed',
        'completed', 'reopened', 'cancelled', 'team_changed',
      ],
      required: true,
    },
    details: { type: String, default: '' },
    // For status/priority changes
    previousValue: { type: String, default: '' },
    newValue: { type: String, default: '' },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true }
);

TaskActivitySchema.index({ taskId: 1, createdAt: -1 });

module.exports = mongoose.model('TaskActivity', TaskActivitySchema);
