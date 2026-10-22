import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

function loadModule(relativePath, imports = {}) {
  const source = fs.readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, Error, require(name) {
    if (!(name in imports)) throw new Error(`Unexpected import: ${name}`);
    return imports[name];
  } });
  return exports;
}

const calculator = loadModule("../src/lib/acquisitions/investment-calculator.ts");

// Exercise the component's input handlers and render output without a browser.
function mount() {
  const state = [];
  let cursor = 0;
  const jsx = (type, props) => ({ type, props });
  const { PropertyInvestmentCalculator } = loadModule("../src/components/acquisitions/investment-calculator.tsx", {
    react: {
      useMemo: (fn) => fn(),
      useState(initial) {
        const index = cursor++;
        if (!(index in state)) state[index] = initial;
        return [state[index], (value) => { state[index] = typeof value === "function" ? value(state[index]) : value; }];
      },
    },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "next/navigation": { useRouter: () => ({ refresh() {} }) },
    "lucide-react": { Calculator: "Calculator", Save: "Save" },
    "@/lib/acquisitions/investment-calculator": calculator,
  });
  return () => {
    cursor = 0;
    return PropertyInvestmentCalculator({
      leadId: "test-lead", propertyId: "test-property", propertyMarketId: null,
      criteria: [], initial: null, prefill: { purchasePrice: 200000, expectedMonthlyRent: 2000 }, canEdit: true,
    });
  };
}

function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!tree || typeof tree !== "object") return [];
  return [tree, ...nodes(tree.props?.children)];
}

function input(tree, label) {
  const field = nodes(tree).find(node => node.type === "label" && node.props.children[0] === label);
  return nodes(field).find(node => node.type === "input");
}

test("out-of-range management percentages show validation and recover when corrected", () => {
  const render = mount();
  let tree = render();
  input(tree, "Property management").props.onChange({ target: { value: "125" } });
  tree = render();
  assert.match(nodes(tree).find(node => node.props?.role === "alert").props.children, /between 0% and 100%/);
  assert.equal(nodes(tree).find(node => node.type === "button").props.disabled, true);

  input(tree, "Property management").props.onChange({ target: { value: "8.5" } });
  tree = render();
  assert.equal(nodes(tree).some(node => node.props?.role === "alert"), false);
  assert.equal(nodes(tree).find(node => node.type === "button").props.disabled, false);
  assert.ok(nodes(tree).some(node => node.props?.label === "Est. monthly cash flow" && node.props.value === "$1,830"));
});

test("negative amounts also show validation instead of crashing", () => {
  const render = mount();
  const tree = render();
  input(tree, "Purchase price").props.onChange({ target: { value: "-1" } });
  assert.ok(nodes(render()).some(node => node.props?.role === "alert"));
});

test("management boundaries and cleared inputs remain usable", () => {
  const render = mount();
  for (const value of ["0", "100", ""]) {
    input(render(), "Property management").props.onChange({ target: { value } });
    assert.equal(nodes(render()).some(node => node.props?.role === "alert"), false);
  }
});
