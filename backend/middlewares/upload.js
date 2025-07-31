import multer from "multer";

const storage = multer.memoryStorage(); // pour obtenir un buffer
const upload = multer({ storage });

export default upload;
