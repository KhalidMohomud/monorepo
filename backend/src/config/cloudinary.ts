import { v2 as cloudinary } from "cloudinary";

import { env } from "./env.js";

// Credentials stay server-side; test suites do not perform external uploads.
cloudinary.config({
  cloud_name: env.CLOUDINARY_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };
