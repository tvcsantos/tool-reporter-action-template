[kubeconform]: https://github.com/yannh/kubeconform
[test-badge]: https://github.com/tvcsantos/tool-reporter-action-template/actions/workflows/test.yml/badge.svg

# Tool Reporter GitHub Action template

![test workflow][test-badge]

## Overview

This action template repository aims to provide support for generic reporting tools results in your builds.

Several output modes are supported depending on the user input and if the action is run on a pull request:
- `pr-comment` - report will be added as a comment on PR.
- `check` - report will be added in a GitHub check.
- `summary` - report will be added as a summary.

In this example we have implemented it for [`Kubeconform`][kubeconform], a FAST Kubernetes manifests validator, with
support for Custom Resources!

### Examples

Below we illustrate examples of expected outputs depending on the report mode.

#### Mode `pr-comment`

> ℹ️ By default when the action runs with `pr-comment` mode in a non pull-request context we will produce a report using
> `summary` mode.

When running in `pr-comment` mode in case of no errors found you will get a comment in you pull request that should look
as follows

![pr-comment-ok](docs/images/pr_comment_ok_example.png)

If errors are found then a nice table will appear in a form of pull request comment highlighting all the important
details for the report as in the example below

![pr-comment-error](docs/images/pr_comment_error_example.png)

#### Mode `check`

When running in `check` mode a GitHub check will be created to add the report. In case of no errors found your check
will succeed, and you will get something as follows

![check-ok](docs/images/check_ok_example.png)

If errors are found, the GitHub check will fail, and you will obtain the following

![check-error](docs/images/check_error_example.png)

#### Mode `summary`

When running in `summary` mode a summary will be created with the following if no errors are found

![summary-ok](docs/images/summary_ok_example.png)

And in case of errors with the following 

![summary-error](docs/images/summary_error_example.png)

## Changelog

All notable changes to this project are documented in [`CHANGELOG.md`](CHANGELOG.md).

## Usage example

> ℹ️ Note that the following example is an illustration for the particular implementation in the example of
> `Kubeconform`, so please adapt it to your case.

```yaml
on:
  push:
    branches:
      - main

jobs:
  build:
    name: Build 
    runs-on: ubuntu-latest
    steps:
      - name: Do Kubeconform report
        uses: tvcsantos/kubeconform-reporter@v1
        with:
          file: /path/to/kubeconform/results/file.json
```

### Inputs

> ℹ️ Note that the following inputs are an illustration for the particular implementation in the example of
> `Kubeconform`, so please adapt them to your case.

| Input           | Type    | Required | Default Value         | Description                                                                          |
|-----------------|---------|----------|-----------------------|--------------------------------------------------------------------------------------|
| `file`          | String  | Yes      | -                     | Path to `Kubeconform` `JSON` results file.                                           |
| `show-filename` | Boolean | No       | `true`                | Show references to filenames that have errors in the report.                         |
| `mode`          | Enum    | No       |                       | Report output mode. <ul><li>`pr-comment`</li><li>`check`</li><li>`summary`</li></ul> |
| `token`         | Token   | No       | `${{ github.token }}` | Your GitHub token.                                                                   |

### Outputs

> ℹ️ In the example of `Kubeconform` we don't produce output values, so don't forget to add yours here if required.

No outputs available.

## License

The scripts and documentation in this project are released under the [MIT License](LICENSE.md).

## Contributions

Contributions are welcome! See [Contributor's Guide](CONTRIBUTING.md).
