import { isNil } from 'lodash';

/**
 * 表单默认值获取函数 (极客复印机)
 * @param fields 表单上有哪些格子 (比如 ['username', 'email'])
 * @param params 场景是什么？是新建空白的('create')，还是要填上旧数据修改的('update')？
 */
export const getDefaultFormValues = <T extends Record<string, any>, R extends Record<string, any>>(
    fields: Array<keyof T>,
    params?: { type: 'create' } | { type: 'update'; item: T },
) => {
    // 1. 准备一张纸
    const item = {} as T;
    
    // 2. 如果是修改模式，就把旧数据(item)按格子抄到纸上
    if (params?.type === 'update') {
        for (const field of fields) {
            if (field in params.item) item[field] = params.item[field];
        }
    }

    // 3. 做最后的底线防御：哪怕是抄了，有些格子可能还是没填，或者本来就是新建模式。对于这些没填项，全部乖乖填上空字符串 ''
    const data = fields.reduce(
        (acc, field) => {
            acc[field] = params?.type === 'update' && !isNil(acc[field]) ? acc[field] : '';
            return acc;
        },
        item as Record<keyof T, any>,
    ) as R;
    
    // 4. 把印好的纸递出去
    return data;
};
