# Minecraft Data File to DataPack Converter

This is a simple utility that transforms a single "data file" into zipped Minecraft datapack or reverse,
make easier to edit/create.
The data file could be either JSON format or YAML format.

The structure of the data file looks like this (in JSON form, YAML is similar):
```js
{
  "pack": {
    "version": 1,
    "description": "Meta data written inside pack.mcmeta"
  },
  "functions": {
    "namespace:path/to/function": [
      // the content of .mcfunction file here.
    ],
    "#namespace:path/to/sometag": {
      "value": [
        // Tags can be here too
      ]
    }
  },
  // Below are all supported categories
  // To define, just embed the JSON data as the value of the namespaced ID.
  "advancements": {
    // Advancements
  },
  "loot_tables": {
    // Loot Tables
  },
  "predicates": {
    // Predicates
  },
  "receipes": {
    // Receipes
  },
  "structures": {
    // Structures (experimental)
  },
  "blocks": {
    // Tag Definitions for Blocks
  },
  "entity_types": {
    // Tag Definitions for Entity Types
  },
  "fluids": {
    // Tag Definitions for Fluids
  },
  "items": {
    // Tag Definitions for Item tags
  }
}
```

## CLI Usage

It is pending to be submitted on to NPM, in the mean while, clone the repository, setup the npm environment and call `node /path/to/repository` instead.

```sh
$ mcds pack datafile.json ~/.minecraft/saves/world/datapack/somedatapack.zip
```

```sh
$ mcds unpack ~/.minecraft/saves/world/datapack/somedatapack.zip datafile.yml
```

## License

MIT
