import { generateResolvers, handleResolve } from '../resolvers';

describe('resolvers', () => {
  it('takes graphql and maps a command', () => {
    const info = {
      fieldNodes: [
        {
          name: { value: 'PAGEVIEWS_ORIGINAL' },
          selectionSet: {
            selections: [{ name: { value: 'command' } }, { name: { value: 'viewtime' } }],
          },
        },
      ],
    };
    const resolvedValue = handleResolve(undefined, {}, {}, info);
    expect(resolvedValue).toEqual({ command: 'select viewtime from PAGEVIEWS_ORIGINAL;' });
  });

  it('creates resolvers for queries and subscriptions', () => {
    const subscription = jest.fn();
    const fields = { one: 'one', two: 'two' };
    const { queryResolvers, subscriptionResolvers } = generateResolvers(fields, subscription);
    expect(queryResolvers).toEqual({
      one: expect.any(Function),
      two: expect.any(Function),
    });
    expect(subscriptionResolvers).toEqual({
      one: { subscribe: expect.any(Function) },
      two: { subscribe: expect.any(Function) },
    });
  });
});
