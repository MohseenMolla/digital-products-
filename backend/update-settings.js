import mongoose from 'mongoose';

async function updateSiteSettings() {
  try {
    // আপনার .env থেকে পাওয়া MongoDB URI
    await mongoose.connect('mongodb+srv://muhammedmohseen1_db_user:SMttzoFoas2UGeUa@cluster0.x5c5gyh.mongodb.net/');

    // সরাসরি sitesettings কালেকশনে আপডেট কুয়েরি চালানো হচ্ছে
    const db = mongoose.connection.db;
    const result = await db.collection('sitesettings').findOneAndUpdate(
      { key: 'main' },
      { 
        $set: { 
          siteName: 'NeuroMark-IT' 
        } 
      },
      { returnDocument: 'after', upsert: true }
    );

    console.log('Successfully updated siteName to NeuroMark-IT:', result);
    process.exit(0);
  } catch (error) {
    console.error('Error updating settings:', error);
    process.exit(1);
  }
}

updateSiteSettings();