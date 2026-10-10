import mongoose from 'mongoose';
import { connectDB } from './config/db';
import { Category } from './models/Category';
import { Product } from './models/Product';
import { SiteSetting } from './models/SiteSetting';
import { User } from './models/User';
import { encrypt } from './utils/helpers';

async function run() {
  await connectDB();

  // DEVELOPMENT CREDENTIALS. mustChangePassword forces a change on first login. Change/remove in production.
  if (!(await User.findOne({ email: 'admin@example.com' }))) {
    await User.create({ name: 'Super Admin', email: 'admin@example.com', phone: '01700000000', password: 'ChangeMe123!', role: 'SUPER_ADMIN', mustChangePassword: true });
    console.log('Created admin@example.com / ChangeMe123!  (development credentials - change immediately)');
  }

  const cats: Record<string, string> = {};
  for (const [i, name] of ['Courses', 'Premium Apps', 'PDF', 'Digital Products', 'Other'].entries()) {
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const c = await Category.findOneAndUpdate({ slug }, { name, slug, order: i }, { upsert: true, new: true });
    cats[name] = String(c._id);
  }

  const items = [
    {
      title: 'Premium AI Course', slug: 'premium-ai-course', productType: 'COURSE' as const, accessType: 'ONLINE' as const, category: cats['Courses'],
      shortDescription: 'Go from zero to building real AI-powered workflows.', description: 'A practical, project-based course covering prompt engineering, automation and AI tools.',
      price: 1999, comparePrice: 3499, featured: true, bestseller: true, status: 'PUBLISHED' as const,
      features: ['Lifetime access', 'Project-based lessons', 'Progress tracking'], whatYouGet: ['12 video lessons', 'Downloadable templates', 'Community support'],
      faqs: [{ question: 'Is it beginner friendly?', answer: 'Yes. No prior AI experience is required.' }],
      courseModules: [
        { title: 'Getting started', lessons: [
          { title: 'Welcome and overview', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', description: 'Course overview.', duration: '5:00', resources: [] },
          { title: 'Setting up your tools', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', description: 'Install and configure.', duration: '9:30', resources: [] },
        ] },
        { title: 'Prompt engineering', lessons: [{ title: 'Writing effective prompts', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', description: 'Core techniques.', duration: '14:10', resources: [] }] },
      ],
    },
    {
      title: 'ChatGPT PDF Guide', slug: 'chatgpt-pdf-guide', productType: 'PDF' as const, accessType: 'DOWNLOAD' as const, category: cats['PDF'],
      shortDescription: 'A concise guide to getting more from ChatGPT.', description: 'Prompt patterns, workflows and examples in a single downloadable guide. Upload the PDF from the admin panel after seeding.',
      price: 499, comparePrice: 799, featured: true, status: 'PUBLISHED' as const, downloadLimit: 5,
      features: ['Instant download', 'Printable'], whatYouGet: ['PDF guide', 'Prompt cheat-sheet'],
    },
    {
      title: 'Premium App Access', slug: 'premium-app-access', productType: 'PREMIUM_APP' as const, accessType: 'ACCOUNT' as const, category: cats['Premium Apps'],
      shortDescription: 'Shared premium account access for 30 days.', description: 'Get login credentials and activation instructions immediately after verified payment.',
      price: 299, comparePrice: 599, featured: true, status: 'PUBLISHED' as const, duration: 30,
      features: ['Instant credentials', '30 days access'], whatYouGet: ['Login details', 'Activation instructions'],
      appInstructions: 'Log in with the provided credentials. Do not change the password.',
      appCredentials: { loginEmail: 'sample-account@example.com', passwordEnc: encrypt('sample-password-change-me'), loginUrl: 'https://example.com/login', notes: 'Sample credentials - replace from the admin panel.', expiresAt: null },
    },
  ];
  for (const it of items) await Product.findOneAndUpdate({ slug: it.slug }, it, { upsert: true, new: true, setDefaultsOnInsert: true });

  if (!(await SiteSetting.findOne({ key: 'main' }))) await SiteSetting.create({ key: 'main' });
  console.log('Seed complete');
  await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
