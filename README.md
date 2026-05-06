# 🌉 Bridge CLI

Write your logic once. Compile it everywhere.

Bridge lets you write business logic in a simple `.bridge` syntax and compile it into **PHP**, **TypeScript**, or **Node.js**.

---

## 🚀 Installation

```bash
npm install -g @cas8398/bridge-cli
```

---

## 🛠 Usage

### 1. Create a `.bridge` file

```bridge
function calculateTax(price: float, rate: float): float {
  let tax = price * rate
  return tax
}
```

---

### 2. Compile

**To PHP**

```bash
bridge compile calculator.bridge --target php
```

**To TypeScript**

```bash
bridge compile calculator.bridge --target ts
```

---

## 📦 Output Example

**TypeScript**

```ts
export function calculateTax(price: number, rate: number): number {
  const tax = price * rate;
  return tax;
}
```

**PHP**

```php
function calculateTax(float $price, float $rate): float {
  $tax = $price * $rate;
  return $tax;
}
```

---

## 🔌 VS Code Extension

Syntax highlighting & snippets:

https://marketplace.visualstudio.com/items?itemName=FlagoDNA.bridge-vscode

---

## 📄 License

MIT
