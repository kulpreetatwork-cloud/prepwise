import Template from '../models/Template.js';

export const getTemplates = async (req, res, next) => {
  try {
    const [userTemplates, defaultTemplates] = await Promise.all([
      Template.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean(),
      Template.find({ isDefault: true }).sort({ usageCount: -1 }).lean(),
    ]);

    res.json({
      success: true,
      templates: [...defaultTemplates, ...userTemplates],
    });
  } catch (error) {
    next(error);
  }
};

export const createTemplate = async (req, res, next) => {
  try {
    const { name, description, config, color } = req.body;

    if (!name || !config) {
      res.status(400);
      throw new Error('Name and config are required');
    }

    const userTemplateCount = await Template.countDocuments({
      userId: req.user._id,
      isDefault: false,
    });

    if (userTemplateCount >= 20) {
      res.status(400);
      throw new Error('Maximum 20 custom templates allowed');
    }

    const template = await Template.create({
      userId: req.user._id,
      name: name.trim(),
      description: description?.trim() || '',
      config,
      color: color || '#8B5CF6',
      isDefault: false,
    });

    res.status(201).json({ success: true, template });
  } catch (error) {
    next(error);
  }
};

export const updateTemplate = async (req, res, next) => {
  try {
    const template = await Template.findById(req.params.id);

    if (!template) {
      res.status(404);
      throw new Error('Template not found');
    }
    if (template.isDefault) {
      res.status(403);
      throw new Error('Cannot edit default templates');
    }
    if (template.userId?.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized');
    }

    const { name, description, config, color } = req.body;
    if (name) template.name = name.trim();
    if (description !== undefined) template.description = description.trim();
    if (config) template.config = config;
    if (color) template.color = color;

    await template.save();
    res.json({ success: true, template });
  } catch (error) {
    next(error);
  }
};

export const deleteTemplate = async (req, res, next) => {
  try {
    const template = await Template.findById(req.params.id);

    if (!template) {
      res.status(404);
      throw new Error('Template not found');
    }
    if (template.isDefault) {
      res.status(403);
      throw new Error('Cannot delete default templates');
    }
    if (template.userId?.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized');
    }

    await Template.deleteOne({ _id: template._id });
    res.json({ success: true, message: 'Template deleted' });
  } catch (error) {
    next(error);
  }
};

export const useTemplate = async (req, res, next) => {
  try {
    await Template.findByIdAndUpdate(req.params.id, {
      $inc: { usageCount: 1 },
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
