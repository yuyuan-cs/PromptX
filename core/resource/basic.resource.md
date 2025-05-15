<resource protocol="context">
# Context 协议

## 语法
@context://[class]/[id]

## 说明
用于引用系统定义的上下文信息。通过class和id组合访问相应的上下文内容，为AI提供情境感知能力。

## 使用方式
1. 引用特定上下文: `@context://project/rootDir` - 引用project类中ID为"rootDir"的上下文
2. 获取上下文信息: 系统会自动提取并提供指定ID的上下文内容
</resource>

<resource protocol="memory">
# Memory 协议

## 语法
@memory://[id]

## 说明
用于引用记忆系统中存储的内容。通过记忆ID访问对应的记忆内容，记忆内容存储在项目根目录的`.memory`目录下。

## 使用方式
1. 引用特定记忆: `@memory://context` - 引用ID为"context"的记忆
2. 获取记忆内容: 系统会自动检索`.memory/context.md`文件并提取其内容
</resource>

<resource protocol="experience">
# Experience 协议

## 语法
@experience://[class]/[id]

## 说明
用于引用系统积累的经验知识。通过class和id组合访问相应的经验内容，为AI提供经验复用能力。

## 使用方式
1. 引用特定经验: `@experience://problem_solving/error_handling` - 引用problem_solving类中ID为"error_handling"的经验
2. 获取经验知识: 系统会自动提取并应用指定的经验内容
</resource>