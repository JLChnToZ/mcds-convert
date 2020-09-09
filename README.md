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
      // It can be array of string (one command per entry),
      // or plain string contents.
    ],
    // Any path starts with # indicates this is a tag definition
    // (As in references of commands)
    "#namespace:path/to/sometag": {
      "values": [
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
    // Structures (experimental), may be one of following:
    // - URL (can be in file/http(s)/data URI scheme)
    // - File path (can be absolute/relative/local/remote)
    // - Stringified NBT string (The format used in commands)
    // - Raw binary tag (YAML only)
  },
  "dimension_type": {
    // Dimension types (>= 1.16.2)
  },
  "dimension": {
    // Dimension data (>= 1.16.2)
  },
  "worldgen/biome": {
    // World Generator Specific Definitions (>= 1.16.2)
  },
  "worldgen/configured_carver": {
    // World Generator Specific Definitions (>= 1.16.2)
  },
  "worldgen/configured_feature": {
    // World Generator Specific Definitions (>= 1.16.2)
  },
  "worldgen/configured_structure_feature": {
    // World Generator Specific Definitions (>= 1.16.2)
  },
  "worldgen/configured_surface_builder": {
    // World Generator Specific Definitions (>= 1.16.2)
  },
  "worldgen/noise_settings": {
    // World Generator Specific Definitions (>= 1.16.2)
  },
  "worldgen/processor_list": {
    // World Generator Specific Definitions (>= 1.16.2)
  },
  "worldgen/template_pool": {
    // World Generator Specific Definitions (>= 1.16.2)
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
