import jwt from "jsonwebtoken";

const authAdmin = async (req, res, next) => {
  try {
    // Read the Authorization header
    const authHeader = req.headers.authorization;

    // Check if header exists and starts with "Bearer "
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ No Bearer token in Authorization header");
      return res.status(401).json({ success: false, message: "Not Authorized. Login Again." });
    }

    // Extract token string after "Bearer "
    const token = authHeader.split(" ")[1];

    if (!token) {
      console.log("❌ Token not found after Bearer");
      return res.status(401).json({ success: false, message: "Not Authorized. Login Again." });
    }

    // Verify token using JWT_SECRET
    const token_decode = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token decoded:", token_decode);

    // Confirm token's email matches the admin email in environment variables
    if (token_decode.email !== process.env.ADMIN_EMAIL) {
      console.log(`❌ Email mismatch: ${token_decode.email} !== ${process.env.ADMIN_EMAIL}`);
      return res.status(403).json({ success: false, message: "Not Authorized. Login Again." });
    }

    // Attach decoded admin info to the request object for downstream usage
    req.admin = token_decode;

    // Proceed to next middleware or route handler
    next();
  } catch (error) {
    console.error("❌ Token verification failed:", error.message);
    return res.status(401).json({ success: false, message: "Invalid or expired token." });
  }
};

export default authAdmin;
