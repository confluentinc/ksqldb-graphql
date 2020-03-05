# Contributing

Thanks for helping us to make ksqldb-graphql even better!

If you have any questions about how to contribute, either [create a github issue](https://github.com/confluentinc/ksqldb-graphql/issues) or ask your question in the #ksqldb-dev-graphql channel in our public [Confluent Community Slack](https://slackpass.io/confluentcommunity) (account registration is free and self-service).

### Guidelines for Contributing Code, Examples, Documentation

When submitting a pull request (PR), use the following guidelines:

* Add/update documentation appropriately for the change you are making.
* If you are introducing a new feature you may want to first submit your idea by creating a [new GitHub issue](https://github.com/confluentinc/ksqldb-graphql/issues) to solicit feedback.
* Add tests. We can never have too many tests. There are a lot of complicated ksql topologies out there, but make sure to clear any PII from the topology before commiting it.
* Try to keep pull requests short and submit separate ones for unrelated features. Feel free to combine simple bugfixes/tests into one pull request.
* Keep the number of commits small and combine commits for related changes. Ideally, there would be one commit per pull request, since all of the changes are rebased by the committer.
* Each commit should compile on its own and pass tests and lint. The CI tool runs these automatically, so having a passing CI build is needed before merging.
* When creating commit messages, follow the guidelines for [Conventional Commits][https://www.conventionalcommits.org/]. There is a pre-commit hook to enforce this.
