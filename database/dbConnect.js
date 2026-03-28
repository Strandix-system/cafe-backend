import mongoose from "mongoose";

const SERVER_SELECTION_TIMEOUT_MS = Number(process.env.DB_CONNECT_TIMEOUT_MS || 20000);

const isSrvDnsError = (error) =>
  error?.code === "EREFUSED" &&
  String(error?.hostname || "").startsWith("_mongodb._tcp.");

const connectDB = async () => {
  const uris = [process.env.DB_URL?.trim(), process.env.DB_DIRECT_URL?.trim()]
    .filter(Boolean)
    .filter((uri, index, list) => list.indexOf(uri) === index);

  if (!uris.length) {
    console.error("Database connection failed: set DB_URL (or DB_DIRECT_URL).");
    process.exit(1);
  }

  let lastError = null;

  for (let index = 0; index < uris.length; index += 1) {
    const uri = uris[index];
    const isPrimary = index === 0;

    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
      });
      console.log(`Database connected successfully (${isPrimary ? "primary" : "fallback"})`);
      return;
    } catch (error) {
      lastError = error;
      if (isPrimary && uris.length > 1) {
        console.warn(
          `Primary database URI failed: ${error.message}. Trying fallback DB_DIRECT_URL...`
        );
      }
    }
  }

  if (isSrvDnsError(lastError)) {
    console.error(
      "MongoDB SRV DNS lookup failed. If your network blocks SRV records, set DB_DIRECT_URL with a standard mongodb:// URI from MongoDB Atlas."
    );
  }

  console.error(`Database connection failed: ${lastError?.message || "Unknown error"}`);
  process.exit(1);
};

export default connectDB;
