npm install

npm run build

npm uninstall -g @bridge/cli

npm install -g .

---

# 1. Check the generated bridge file

bridge to-bridge Product.php
bridge js-to-bridge Product.ts

# 2. Test converting bridge back to PHP

bridge to-php bridge-output/bridge/Product.bridge

# 3. Test converting bridge to TypeScript

bridge to-js bridge-output/bridge/Product.bridge

# 4. Test creating a new project

cd ~/Documents/GitHub/@bridge/bridge-cli
bridge new test-app

# 5. Build the new project

cd my-test-app
bridge build

# 6. Test watch mode (in another terminal)

bridge watch
