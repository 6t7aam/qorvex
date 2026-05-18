-- =========================================================================
-- Qorvex — Seed data for the templates table
-- Run this AFTER schema.sql.
-- =========================================================================

insert into public.templates (id, name, description, category, icon, base_prompt, features, tags, is_premium) values
  ('fitness-tracker', 'Fitness Tracker', 'Track workouts, calories and progress', 'health', 'Dumbbell',
   'Create a fitness tracker mobile app with workout logging, exercise library with sets/reps/weight tracking, calorie counter, progress charts, streak tracking, and motivational notifications. Use a dark energetic theme with green accents.',
   ARRAY['Workout logging', 'Exercise library', 'Progress charts', 'Calorie tracking', 'Streak system', 'Push notifications'],
   ARRAY['fitness', 'health', 'tracker'], false),

  ('habit-tracker', 'Habit Tracker', 'Build and maintain daily habits', 'productivity', 'CheckSquare',
   'Create a habit tracker mobile app with daily habit check-ins, streak counters, habit categories, weekly/monthly progress views, reminders, and a satisfying completion animation. Use a clean minimal design with purple accents.',
   ARRAY['Daily check-ins', 'Streak tracking', 'Categories', 'Progress views', 'Reminders', 'Analytics'],
   ARRAY['productivity', 'habits', 'daily'], false),

  ('ai-chat', 'AI Chat App', 'Chat interface powered by AI', 'ai', 'MessageSquare',
   'Create an AI chat mobile app with conversation threads, message history, typing indicators, markdown rendering in responses, model selection, and a clean chat interface. Use a modern dark theme.',
   ARRAY['Conversation threads', 'Message history', 'Typing indicators', 'Markdown support', 'Multiple AI models', 'Export conversations'],
   ARRAY['ai', 'chat', 'messaging'], false),

  ('social-app', 'Social App', 'Share posts and connect with friends', 'social', 'Users',
   'Create a social media mobile app with a photo/text feed, user profiles, follow system, likes and comments, stories feature, direct messaging, notifications, and hashtag discovery. Use a vibrant modern design.',
   ARRAY['Photo and text feed', 'User profiles', 'Follow system', 'Likes and comments', 'Stories', 'Direct messaging'],
   ARRAY['social', 'feed', 'community'], true),

  ('restaurant-booking', 'Restaurant Booking', 'Reserve tables at restaurants', 'food', 'UtensilsCrossed',
   'Create a restaurant booking mobile app with restaurant discovery, search and filters, table reservation system, menu browsing, reviews and ratings, booking history, and reminder notifications. Use a warm appetizing design.',
   ARRAY['Restaurant discovery', 'Table reservations', 'Menu browsing', 'Reviews and ratings', 'Booking history', 'Reminders'],
   ARRAY['food', 'booking', 'restaurant'], false),

  ('finance-tracker', 'Finance Tracker', 'Track income expenses and budgets', 'finance', 'TrendingUp',
   'Create a personal finance mobile app with expense tracking by category, income logging, budget goals, spending charts, monthly reports, bill reminders, and a net worth tracker. Use a professional clean design with blue accents.',
   ARRAY['Expense tracking', 'Budget goals', 'Spending charts', 'Income logging', 'Monthly reports', 'Bill reminders'],
   ARRAY['finance', 'budget', 'money'], true),

  ('meditation-app', 'Meditation App', 'Guided meditation and mindfulness', 'wellness', 'Brain',
   'Create a meditation mobile app with guided meditation sessions, breathing exercises, ambient sounds, session timer, streak tracking, mood journal, and sleep sounds. Use a calming design with soft gradients and nature imagery.',
   ARRAY['Guided meditations', 'Breathing exercises', 'Ambient sounds', 'Session timer', 'Mood journal', 'Sleep sounds'],
   ARRAY['wellness', 'meditation', 'calm'], false),

  ('marketplace', 'Marketplace', 'Buy and sell items in your community', 'commerce', 'ShoppingBag',
   'Create a local marketplace mobile app with product listings, photo upload, category browsing, search with filters, seller profiles, in-app messaging between buyers and sellers, saved items, and transaction history. Use a fresh modern design.',
   ARRAY['Product listings', 'Photo upload', 'Category browsing', 'Search and filters', 'Seller profiles', 'In-app messaging'],
   ARRAY['commerce', 'marketplace', 'shop'], true)
on conflict (id) do update
  set name          = excluded.name,
      description   = excluded.description,
      category      = excluded.category,
      icon          = excluded.icon,
      base_prompt   = excluded.base_prompt,
      features      = excluded.features,
      tags          = excluded.tags,
      is_premium    = excluded.is_premium;
