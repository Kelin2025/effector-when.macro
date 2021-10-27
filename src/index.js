import invariant from 'invariant';
import { createMacro } from 'babel-plugin-macros';

let when = createMacro(function whenMacros({ references, state, babel }) {
  references.default.map(referencePath => {
    // If `when` isn't called, throw an Error
    invariant(
      referencePath.parentPath.type === 'CallExpression',
      `This is not supported: \`${referencePath
        .findParent(babel.types.isExpression)
        .getSource()}\`. Please see the when.macro documentation`
    );

    // Get `when` arguments
    const t = babel.types;
    const callExpressionPath = referencePath.parentPath;
    const args = callExpressionPath.get('arguments');
    invariant(Array.isArray(args), 'Args is not an array');

    // Check filter and callback to be valid
    const [filterPath, callbackPath] = args;

    invariant(filterPath, 'Should have filter passed');
    invariant(callbackPath, 'Should have callback passed');
    invariant(
      // TODO: How do we get if something is a store?
      // is.store(filter) || typeof filter === "function",
      true,
      `Expect filter to be either a store or a function, but got ${typeof filterPath}`
    );
    invariant(
      ['ArrowFunctionExpression', 'FunctionExpression'].includes(
        callbackPath.type
      ),
      `Expect 2nd argument to be a function, but got ${typeof callbackPath} passed`
    );

    // Get callback body statements
    const bodyPath = callbackPath.get('body');
    const bodyBodyPaths = bodyPath.get('body');

    // Callback traverse
    bodyBodyPaths.forEach(bodyBodyPath => {
      // Filter only expressions
      if (bodyBodyPath.type !== 'ExpressionStatement') {
        return;
      }

      // Look for Effector operator/units calls
      const expressionPath = bodyBodyPath.get('expression');
      if (expressionPath.type !== 'CallExpression') {
        return;
      }

      // Take callee and arguments of the expression
      const calleePath = expressionPath.get('callee');
      const argumentsPaths = expressionPath.get('arguments');

      let unitPathToReplace = null;

      // Checking store.on expressions
      if (calleePath.type === 'MemberExpression') {
        const propertyPath = calleePath.get('property');
        if (propertyPath.node.name === 'on') {
          const firstArgumentPath = argumentsPaths[0];
          unitPathToReplace = firstArgumentPath;
        }
      }

      if (calleePath.type === 'Identifier') {
        // Replacing samples
        if (calleePath.node.name === 'sample') {
          const firstArgumentPath = argumentsPaths[0];
          const propertiesPaths = firstArgumentPath.get('properties');
          let clockPath = propertiesPaths.find(propertyPath => {
            return propertyPath.node.key.name === 'clock';
          });
          if (clockPath) {
            const valuePath = clockPath.get('value');
            unitPathToReplace = valuePath;
          }
          let sourcePath = propertiesPaths.find(propertyPath => {
            return propertyPath.node.key.name === 'source';
          });
          if (sourcePath) {
            const valuePath = sourcePath.get('value');
            unitPathToReplace = valuePath;
          }
        }

        // Replacing guards
        if (calleePath.node.name === 'guard') {
          const firstArgumentPath = argumentsPaths[0];
          const propertiesPaths = firstArgumentPath.get('properties');
          let clockPath = propertiesPaths.find(propertyPath => {
            return propertyPath.node.key.name === 'clock';
          });
          if (clockPath) {
            const valuePath = clockPath.get('value');
            unitPathToReplace = valuePath;
          }
          let sourcePath = propertiesPaths.find(propertyPath => {
            return propertyPath.node.key.name === 'source';
          });
          if (sourcePath) {
            const valuePath = sourcePath.get('value');
            unitPathToReplace = valuePath;
          }
        }

        // Replacing forwards
        if (calleePath.node.name === 'forward') {
          const firstArgumentPath = argumentsPaths[0];
          const propertiesPaths = firstArgumentPath.get('properties');
          propertiesPaths.forEach(propertyPath => {
            if (propertyPath.node.key.name === 'from') {
              const valuePath = propertyPath.get('value');
              unitPathToReplace = valuePath;
            }
          });
        }
      }

      // Replacing found node
      if (unitPathToReplace) {
        unitPathToReplace.replaceWith(
          t.callExpression(t.identifier('guard'), [
            t.objectExpression([
              t.objectProperty(t.identifier('source'), unitPathToReplace.node),
              t.objectProperty(t.identifier('filter'), filterPath.node),
            ]),
          ])
        );
      }
    });

    // Removing `when wrapper`
    callExpressionPath.replaceWithMultiple(
      bodyBodyPaths.map(body => body.node)
    );
  });
});

export default when;
