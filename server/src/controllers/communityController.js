import Post from '../models/Post.js';
import Comment from '../models/Comment.js';

export const getPosts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      tag,
      search,
      sort = 'recent',
    } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (tag) filter.tags = tag;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'popular') sortOption = { views: -1, createdAt: -1 };
    if (sort === 'most-voted') sortOption = { createdAt: -1 };

    let posts = await Post.find(filter)
      .populate('userId', 'name avatar targetRole')
      .sort(sortOption)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean({ virtuals: true });

    if (sort === 'most-voted') {
      posts.sort((a, b) => b.voteScore - a.voteScore);
    }

    const total = await Post.countDocuments(filter);

    res.json({
      success: true,
      posts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPost = async (req, res, next) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate('userId', 'name avatar targetRole')
      .lean({ virtuals: true });

    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    res.json({ success: true, post });
  } catch (error) {
    next(error);
  }
};

export const createPost = async (req, res, next) => {
  try {
    const { title, content, category, tags } = req.body;

    if (!title || !content || !category) {
      res.status(400);
      throw new Error('Title, content, and category are required');
    }

    const post = await Post.create({
      userId: req.user._id,
      title: title.trim(),
      content: content.trim(),
      category,
      tags: tags
        ? tags
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean)
            .slice(0, 5)
        : [],
    });

    const populated = await Post.findById(post._id)
      .populate('userId', 'name avatar targetRole')
      .lean({ virtuals: true });

    res.status(201).json({ success: true, post: populated });
  } catch (error) {
    next(error);
  }
};

export const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }
    if (post.userId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to edit this post');
    }

    const { title, content, category, tags } = req.body;
    if (title) post.title = title.trim();
    if (content) post.content = content.trim();
    if (category) post.category = category;
    if (tags) {
      post.tags = tags
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 5);
    }

    await post.save();

    const populated = await Post.findById(post._id)
      .populate('userId', 'name avatar targetRole')
      .lean({ virtuals: true });

    res.json({ success: true, post: populated });
  } catch (error) {
    next(error);
  }
};

export const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }
    if (post.userId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to delete this post');
    }

    await Comment.deleteMany({ postId: post._id });
    await Post.deleteOne({ _id: post._id });

    res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    next(error);
  }
};

export const votePost = async (req, res, next) => {
  try {
    const { type } = req.body;
    if (!['up', 'down'].includes(type)) {
      res.status(400);
      throw new Error('Vote type must be "up" or "down"');
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    const uid = req.user._id.toString();
    const upIdx = post.upvotes.findIndex((id) => id.toString() === uid);
    const downIdx = post.downvotes.findIndex((id) => id.toString() === uid);

    if (type === 'up') {
      if (upIdx > -1) {
        post.upvotes.splice(upIdx, 1);
      } else {
        if (downIdx > -1) post.downvotes.splice(downIdx, 1);
        post.upvotes.push(req.user._id);
      }
    } else {
      if (downIdx > -1) {
        post.downvotes.splice(downIdx, 1);
      } else {
        if (upIdx > -1) post.upvotes.splice(upIdx, 1);
        post.downvotes.push(req.user._id);
      }
    }

    await post.save();

    res.json({
      success: true,
      upvotes: post.upvotes,
      downvotes: post.downvotes,
      voteScore: post.upvotes.length - post.downvotes.length,
    });
  } catch (error) {
    next(error);
  }
};

export const getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ postId: req.params.id })
      .populate('userId', 'name avatar targetRole')
      .sort({ createdAt: 1 })
      .lean({ virtuals: true });

    res.json({ success: true, comments });
  } catch (error) {
    next(error);
  }
};

export const createComment = async (req, res, next) => {
  try {
    const { content, parentComment } = req.body;

    if (!content?.trim()) {
      res.status(400);
      throw new Error('Comment content is required');
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    const comment = await Comment.create({
      postId: req.params.id,
      userId: req.user._id,
      content: content.trim(),
      parentComment: parentComment || null,
    });

    post.commentsCount += 1;
    await post.save();

    const populated = await Comment.findById(comment._id)
      .populate('userId', 'name avatar targetRole')
      .lean({ virtuals: true });

    res.status(201).json({ success: true, comment: populated });
  } catch (error) {
    next(error);
  }
};

export const voteComment = async (req, res, next) => {
  try {
    const { type } = req.body;
    if (!['up', 'down'].includes(type)) {
      res.status(400);
      throw new Error('Vote type must be "up" or "down"');
    }

    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      res.status(404);
      throw new Error('Comment not found');
    }

    const uid = req.user._id.toString();
    const upIdx = comment.upvotes.findIndex((id) => id.toString() === uid);
    const downIdx = comment.downvotes.findIndex((id) => id.toString() === uid);

    if (type === 'up') {
      if (upIdx > -1) {
        comment.upvotes.splice(upIdx, 1);
      } else {
        if (downIdx > -1) comment.downvotes.splice(downIdx, 1);
        comment.upvotes.push(req.user._id);
      }
    } else {
      if (downIdx > -1) {
        comment.downvotes.splice(downIdx, 1);
      } else {
        if (upIdx > -1) comment.upvotes.splice(upIdx, 1);
        comment.downvotes.push(req.user._id);
      }
    }

    await comment.save();

    res.json({
      success: true,
      upvotes: comment.upvotes,
      downvotes: comment.downvotes,
      voteScore: comment.upvotes.length - comment.downvotes.length,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      res.status(404);
      throw new Error('Comment not found');
    }
    if (comment.userId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to delete this comment');
    }

    await Post.findByIdAndUpdate(comment.postId, {
      $inc: { commentsCount: -1 },
    });
    await Comment.deleteOne({ _id: comment._id });

    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    next(error);
  }
};
