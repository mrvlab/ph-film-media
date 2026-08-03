// eslint-config-next v16 ships native flat-config arrays (no FlatCompat needed).
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';

const eslintConfig = [...nextCoreWebVitals, ...nextTypeScript];

export default eslintConfig;
