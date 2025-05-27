/* eslint-disable no-console */
import config from './app/config';
import app from './app';
import mongoose from 'mongoose';
const port = process.env.PORT || 3000;

async function main() {
  try {
    await mongoose.connect(config.database_url as string);

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.log(error);
  }
}

main();
