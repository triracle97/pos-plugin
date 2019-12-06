<template>
  <g-dialog v-model="dialogProductLookup" fullscreen ref="dialog" domain="TestDialog2">
    <div class="dialog-lookup w-100">
      <g-toolbar class="header" color="grey lighten 3" elevation="0">
         <g-text-field outlined clearable class="w-50"
                       style="color: #1d1d26" clear-icon="cancel"
                       :value="productNameQuery"
                       @focus="showKeyboard = true"
                       @enter="queryProductsByName"
                       @change="queryProductsByName"
                       @blur="showKeyboard = false"
                       @input="debouncedQuery"
         ></g-text-field>
        <g-spacer></g-spacer>
        <g-btn :uppercase="false" icon style="box-shadow: none; border-radius: 50%" @click="dialogProductLookup = false">
          <g-icon>clear</g-icon>
        </g-btn>
      </g-toolbar>
      <g-simple-table fixed-header :class="tbLookup">
        <thead>
        <tr>
          <th>Name</th>
          <th>Barcode</th>
          <th>Unit</th>
          <th>Attribute</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(product, i) in productNameQueryResults" :key="i" :class="[(selected && product._id === selected._id) && 'tr__selected']" @click="addToOrder(product)">
          <td>{{product.name}}</td>
          <td>{{product.barcode ? product.barcode : '-'}}</td>
          <td>{{product.unit ? product.unit : '-s'}}</td>
          <td>
            <div v-if="product.attribute">
              <span v-for="(val, attr) in product.attribute" class="td-attr">
                {{attr}}: {{val}}
              </span>
            </div>
            <div v-else>-</div>
          </td>
        </tr>
        </tbody>
      </g-simple-table>
      <div v-show="showKeyboard" class="keyboard-wrapper">
        <pos-keyboard-full v-model="productNameQuery"/>
      </div>
    </div>
  </g-dialog>
</template>

<script>
  import PosKeyboardFull from '../../pos-shared-components/PosKeyboardFull';
  import { getInternalValue } from 'pos-vue-framework/src/mixins/getVModel';

  export default {
    name: 'dialogProductLookup',
    components: { PosKeyboardFull },
    injectService: ['PosStore:(productNameQuery,productNameQueryResults,queryProductsByName,addProductToOrder)'],
    props: {
      value: Boolean,
    },
    data() {
      return {
        showKeyboard: false,
        selected: null,
        debouncedQuery: null
      }
    },
    methods: {
      open() {
        this.dialogProductLookup = true;
      },
      addToOrder(product) {
        this.addProductToOrder(product)
        this.selected = product
        setTimeout(() => {
          this.dialogProductLookup = false
        }, 200)
      }
    },
    setup() {
      const dialogProductLookup = getInternalValue(...arguments);
      return { dialogProductLookup };
    },
    computed: {
      tbLookup() {
        return this.showKeyboard ? 'tbLookup' : 'tbLookup__full'
      },
    },
    created() {
      this.productNameQuery = ''
      this.queryProductsByName()

      this.debouncedQuery = _.debounce((e) => {
        this.productNameQuery = e
        this.queryProductsByName()
      }, 300)
    }
  }
</script>

<style scoped lang="scss">
  .dialog-lookup {
    min-height: 100%;
    background-color: white;
    display: flex;
    flex-direction: column;
    border: 16px solid rgba(107, 111, 130, 0.95);

    .g-tf-wrapper fieldset {
      border-radius: 0;
      border: 2px solid #BDBDBD;
    }

    .g-toolbar {
      flex: 0;
    }

    .g-table {
      overflow: scroll;

      &.tbLookup {
        height: calc(65% - 64px) !important;
        flex-basis: calc(65% - 64px);
        flex-grow: 0;
        flex-shrink: 0;

        &__full {
          flex-basis: calc(100% - 64px);
        }
      }

      thead tr th {
        font-size: 13px;
        line-height: 16px;
        color: rgba(29, 29, 38, 0.5);
        background-color: white;
        text-align: left;
      }

      tbody tr td {
        height: 60px;
      }

      .td-attr:not(:last-child) {
        border-right: 1px solid #979797;
        padding-right: 16px;
      }

      .td-attr:not(:first-child) {
        padding-left: 8px;
      }

      .tr__selected {
        td {
          border-top: 1px solid #1271ff !important;
          border-bottom: 1px solid #1271ff !important;
        }

        td:first-child {
          border-left: 1px solid #1271ff !important;
        }

        td:last-child {
          border-right: 1px solid #1271ff !important;
        }
      }
    }

    ::v-deep .keyboard-wrapper {
      flex-basis: 35%;
      height: 35%;
      padding: 16px;
      background-color: #BDBDBD;

      .key {
        border-radius: 0;
        font-size: 24px;
      }
    }
  }
</style>