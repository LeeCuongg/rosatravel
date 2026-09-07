import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // ignoreRestSiblings: bỏ qua các biến sinh ra chỉ để LOẠI một khoá khỏi
      // object (`const { blurDataURL, ...thieu } = mediaDoc` trong
      // src/lib/content/__tests__/map.test.ts). Ở đó biến bị bỏ đi chính là
      // mục đích, không phải chỗ quên dùng. Không có cờ này, mỗi lần chạy lint
      // đều in vài cảnh báo cố định — và cảnh báo cố định dạy người ta thôi
      // đọc output của lint, đúng lúc một cảnh báo thật xuất hiện.
      "@typescript-eslint/no-unused-vars": ["warn", { ignoreRestSiblings: true }],
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
