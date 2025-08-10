// Minimal test to check if we can import components
try {
  // Test 1: Try importing the package
  console.log("Test 1: Import @convex-dev/agent");
  const { Agent } = require("@convex-dev/agent");
  console.log("✅ Agent import successful", typeof Agent);

  // Test 2: Try importing components
  console.log("Test 2: Import components from generated API");
  try {
    const { components } = require("./convex/_generated/api");
    console.log("✅ Components import successful", typeof components);
    console.log("Components keys:", Object.keys(components || {}));
  } catch (err) {
    console.log("❌ Components import failed:", err.message);
  }

  // Test 3: Check what's in the generated API
  console.log("Test 3: Check generated API contents");
  try {
    const api = require("./convex/_generated/api");
    console.log("API keys:", Object.keys(api));
    console.log("API structure:", api);
  } catch (err) {
    console.log("❌ API import failed:", err.message);
  }

} catch (err) {
  console.log("❌ Agent import failed:", err.message);
}