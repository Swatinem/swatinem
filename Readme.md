# swatinem

Just my interpretation of a static site generator.

Transforms (and watches) all `.md`, `.markdown`, `.jade` and `.html` files
inside the `articles` folder and uses the `templates/article.jade` template
to generate a static html file inside the `generated` folder.

A sorted list is passed to the `templates/index.jade` template to generate the
`generated/index.html` file.

The files can have the following metadata:
```
title: The Title
author: Arpad Borsos
time: 2013-03-19T19:30:00.000Z
tags: this, is, currently-unused

And after those two newlines is when the actual content starts
```

## Example nginx config

```
        location / {
                root /var/www/generated;
                try_files $uri $uri.html $uri.xml $uri/index.html index.html @node;
                try_files /index.html @node;
        }
```
