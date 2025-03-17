<script setup lang="ts">
const isOpen = defineModel<boolean>('open')
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogTrigger class="inline-flex items-center gap-2">
      <slot name="trigger" />
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          Select your Image upload method
        </DialogTitle>
      </DialogHeader>
      <Tabs
        default-value="account"
      >
        <TabsList class="grid w-full grid-cols-2">
          <TabsTrigger value="url">
            URL
          </TabsTrigger>
          <TabsTrigger value="upload">
            Upload
          </TabsTrigger>
        </TabsList>
        <TabsContent value="url">
          <Card>
            <CardHeader>
              <CardTitle>Enter your Image url</CardTitle>
            </CardHeader>
            <CardContent class="space-y-2">
              <div class="space-y-1">
                <Input
                  id="url"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </CardContent>
            <CardFooter class="flex justify-end">
              <Button>Save</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload your Image</CardTitle>
            </CardHeader>
            <CardContent class="space-y-2">
              <div class="space-y-1">
                <Input
                  id="upload"
                  type="file"
                />
              </div>
            </CardContent>
            <CardFooter class="flex justify-end">
              <Button>Save</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </DialogContent>
  </Dialog>
</template>
